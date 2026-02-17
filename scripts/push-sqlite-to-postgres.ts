#!/usr/bin/env tsx
/**
 * Push data from local SQLite into Postgres (e.g. Neon).
 *
 * Requires:
 *   - SQLite DB at DATABASE_PATH or data/outerfields.db (source)
 *   - Either DATABASE_URL (full Postgres URL) OR PGHOST, PGUSER, PGPASSWORD, PGDATABASE (target)
 *
 * Run from project root:
 *   npm run db:push
 *
 * Using separate env vars avoids URL-encoding the password:
 *   export PGHOST=ep-xxx.aws.neon.tech
 *   export PGUSER=neondb_owner
 *   export PGPASSWORD=your_actual_password
 *   export PGDATABASE=neondb
 *
 * Postgres schema must already exist (run the app once with DATABASE_URL set
 * so migrations apply, or run this after deploying to Replit).
 */

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const sqlitePath = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'outerfields.db');

// Tables in dependency order (parents before children) for FK safety
const TABLE_ORDER = [
	'users',
	'videos',
	'discovery_calls',
	'comments',
	'transcripts',
	'user_events',
	'bottlenecks',
	'patterns',
	'agent_proposals',
	'audit_log',
	'escalations',
	'applied_changes',
	'_migrations'
];

const CONFLICT_KEY: Record<string, string> = {
	_migrations: 'name'
};
const defaultConflictKey = 'id';

function getConflictKey(table: string): string {
	return CONFLICT_KEY[table] ?? defaultConflictKey;
}

async function main() {
	// Prefer DATABASE_URL; otherwise build from PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT
	let connectionString: string;
	const { DATABASE_URL, PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT } = process.env;

	if (DATABASE_URL?.startsWith('postgres')) {
		connectionString = DATABASE_URL;
	} else if (PGHOST && PGUSER && PGPASSWORD && PGDATABASE) {
		const port = PGPORT || '5432';
		connectionString = `postgresql://${encodeURIComponent(PGUSER)}:${encodeURIComponent(PGPASSWORD)}@${PGHOST}:${port}/${PGDATABASE}?sslmode=verify-full`;
	} else {
		console.error('❌ Set Postgres connection: either DATABASE_URL or (PGHOST, PGUSER, PGPASSWORD, PGDATABASE).');
		console.error('   Use the real password from Replit Secrets (PGPASSWORD), not a placeholder.');
		console.error('   Example: export PGHOST=ep-xxx.neon.tech PGUSER=neondb_owner PGPASSWORD=your_real_password PGDATABASE=neondb');
		process.exit(1);
	}

	// Normalize SSL in URL if present
	if (connectionString.includes('sslmode=')) {
		connectionString = connectionString.replace(/sslmode=[^&]+/, 'sslmode=verify-full');
	} else if (!connectionString.includes('sslmode=')) {
		connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=verify-full';
	}

	if (!existsSync(sqlitePath)) {
		console.error(`❌ SQLite database not found: ${sqlitePath}`);
		process.exit(1);
	}

	const dir = sqlitePath.substring(0, sqlitePath.lastIndexOf('/'));
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}

	const Database = require('better-sqlite3');
	const { Client } = require('pg');

	const sqlite = new Database(sqlitePath, { readonly: true });
	const pg = new Client({ connectionString, ssl: { rejectUnauthorized: true } });

	try {
		await pg.connect();
	} catch (err) {
		console.error('❌ Postgres connection failed:', (err as Error).message);
		console.error('   Check that the password is correct (copy from Replit Production app secrets, PGPASSWORD).');
		sqlite.close();
		process.exit(1);
	}

	let targetHost = PGHOST;
	if (!targetHost) {
		try {
			targetHost = new URL(connectionString).host;
		} catch {
			targetHost = 'Postgres';
		}
	}
	console.log('Source: SQLite at', sqlitePath);
	console.log('Target: Postgres at', targetHost);
	console.log('');

	let totalRows = 0;

	for (const table of TABLE_ORDER) {
		let columns: string[];
		try {
			const pragma = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
			if (pragma.length === 0) continue; // table doesn't exist in SQLite
			columns = pragma.map((p) => p.name);
		} catch {
			continue;
		}

		const rows = sqlite.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[];
		if (rows.length === 0) {
			console.log(`  ${table}: 0 rows (skip)`);
			continue;
		}

		const conflictKey = getConflictKey(table);
		const cols = columns.join(', ');
		const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
		const sql = `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) ON CONFLICT (${conflictKey}) DO NOTHING`;

		let inserted = 0;
		for (const row of rows) {
			const values = columns.map((c) => row[c] ?? null);
			try {
				const res = await pg.query(sql, values);
				if (res.rowCount && res.rowCount > 0) inserted++;
			} catch (err) {
				console.error(`  ${table}: insert failed for row`, row[conflictKey], (err as Error).message);
			}
		}

		const countResult = await pg.query(`SELECT COUNT(*)::int as n FROM ${table}`);
		const pgCount = countResult.rows[0]?.n ?? 0;
		console.log(`  ${table}: ${rows.length} from SQLite, ${inserted} inserted → ${pgCount} total in Postgres`);
		totalRows += rows.length;
	}

	sqlite.close();
	await pg.end();

	console.log('');
	console.log(`✅ Done. Pushed data from ${TABLE_ORDER.length} tables (${totalRows} rows read from SQLite).`);
	console.log('   Existing rows in Postgres were left unchanged (ON CONFLICT DO NOTHING).');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
