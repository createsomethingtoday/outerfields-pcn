/**
 * D1-Compatible Database Wrapper
 *
 * When DATABASE_URL is set (e.g. Neon Postgres on Replit), uses pg.
 * Otherwise uses better-sqlite3. Same API: .prepare().bind().all/first/run()
 */
import { readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let _db: any = null;
let _initFailed = false;
let _isPostgres = false;

/** Convert SQLite ? placeholders to Postgres $1, $2, ... */
function toPgPlaceholders(sql: string): string {
	let i = 0;
	return sql.replace(/\?/g, () => `$${++i}`);
}

/** Make migration SQL Postgres-compatible */
function forPostgres(sql: string): string {
	return sql
		.replace(
			/strftime\s*\(\s*['"]%s['"]\s*,\s*['"]now['"]\s*\)\s*\*\s*1000/gi,
			'(EXTRACT(EPOCH FROM NOW()))::INTEGER * 1000'
		)
		.replace(/strftime\s*\(\s*['"]%s['"]\s*,\s*['"]now['"]\s*\)/gi, '(EXTRACT(EPOCH FROM NOW()))::INTEGER')
		.replace(/INSERT OR IGNORE INTO/gi, 'INSERT INTO')
		.replace(/AUTOINCREMENT/gi, '');
}

/** Run Postgres migrations from /migrations */
async function runPostgresMigrations(client: any): Promise<void> {
	const migrationsDir = join(process.cwd(), 'migrations');
	if (!existsSync(migrationsDir)) return;

	await client.query(`
		CREATE TABLE IF NOT EXISTS _migrations (
			id SERIAL PRIMARY KEY,
			name TEXT NOT NULL UNIQUE,
			applied_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()))::BIGINT
		)
	`);

	const files: string[] = readdirSync(migrationsDir)
		.filter((f: string) => f.endsWith('.sql'))
		.sort();

	for (const file of files) {
		const applied = await client.query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
		if (applied.rows.length > 0) continue;

		let sql = readFileSync(join(migrationsDir, file), 'utf-8');
		sql = forPostgres(sql);

		// INSERT OR IGNORE → ON CONFLICT for seed files
		if (file === '0004_seed_demo_users.sql') {
			sql = sql.replace(/\);\s*$/, ') ON CONFLICT (id) DO NOTHING;');
		}

		// Execute statement by statement (split on semicolon + newline to avoid breaking inside CHECK/values)
		const statements = sql
			.split(/\s*;\s*\n/)
			.map((s) => s.trim())
			.filter((s) => s.length > 0 && !s.startsWith('--'));

		for (const stmt of statements) {
			if (!stmt) continue;
			let s = stmt + (stmt.endsWith(';') ? '' : ';');
			try {
				await client.query(s);
			} catch (err) {
				console.error(`[migration] Failed statement in ${file}:`, (err as Error).message);
			}
		}

		try {
			await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
			console.log(`[migration] Applied: ${file}`);
		} catch (err) {
			console.error(`[migration] Failed to record ${file}:`, err);
		}
	}
}

/**
 * Get or create the singleton database connection.
 * Uses Postgres when DATABASE_URL is set, otherwise SQLite.
 */
function getConnection(): any {
	if (_db) return _db;
	if (_initFailed) throw new Error('Database initialization previously failed');

	const databaseUrl = process.env.DATABASE_URL;

	if (databaseUrl && databaseUrl.startsWith('postgres')) {
		const deasync = require('deasync');
		const { Client } = require('pg');
		const client = new Client({
			connectionString: databaseUrl,
			ssl: { rejectUnauthorized: true }
		});
		deasync(client.connect.bind(client))();
		deasync(runPostgresMigrations.bind(null, client))();
		_db = client;
		_isPostgres = true;
		return _db;
	}

	// SQLite path
	try {
		const Database = require('better-sqlite3');
		const dbPath = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'outerfields.db');
		const dir = dbPath.substring(0, dbPath.lastIndexOf('/'));
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		_db = new Database(dbPath);
		_db.pragma('journal_mode = WAL');
		runMigrations(_db);
		return _db;
	} catch (err) {
		_initFailed = true;
		console.error('[d1-compat] Failed to initialize SQLite:', err);
		throw err;
	}
}

/**
 * Run all migration files in order (SQLite only)
 */
function runMigrations(db: any): void {
	const migrationsDir = join(process.cwd(), 'migrations');
	if (!existsSync(migrationsDir)) return;

	db.exec(`
		CREATE TABLE IF NOT EXISTS _migrations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE,
			applied_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
		)
	`);

	const files: string[] = readdirSync(migrationsDir)
		.filter((f: string) => f.endsWith('.sql'))
		.sort();

	for (const file of files) {
		const applied = db.prepare('SELECT 1 FROM _migrations WHERE name = ?').get(file);
		if (applied) continue;
		const sql = readFileSync(join(migrationsDir, file), 'utf-8');
		try {
			db.exec(sql);
			db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
			console.log(`[migration] Applied: ${file}`);
		} catch (err) {
			console.error(`[migration] Failed: ${file}`, err);
		}
	}
}

/**
 * D1-compatible prepared statement.
 * For Postgres, uses pg client with ? → $1,$2 and deasync for sync API.
 */
class D1PreparedStatement {
	private db: any;
	private sql: string;
	private params: unknown[] = [];
	private isPg: boolean;

	constructor(db: any, sql: string, isPg: boolean) {
		this.db = db;
		this.sql = sql;
		this.isPg = isPg;
	}

	bind(...params: unknown[]): D1PreparedStatement {
		this.params = params;
		return this;
	}

	all<T = Record<string, unknown>>(): { results: T[] } {
		if (this.isPg) {
			const deasync = require('deasync');
			const pgSql = toPgPlaceholders(this.sql);
			const promise = this.db.query(pgSql, this.params);
			const res = deasync(promise);
			const results = (res.rows || []) as T[];
			return { results };
		}
		const stmt = this.db.prepare(this.sql);
		const results = stmt.all(...this.params) as T[];
		return { results };
	}

	first<T = Record<string, unknown>>(): T | null {
		if (this.isPg) {
			const deasync = require('deasync');
			const pgSql = toPgPlaceholders(this.sql);
			const promise = this.db.query(pgSql, this.params);
			const res = deasync(promise);
			const row = res.rows && res.rows[0];
			return (row as T) ?? null;
		}
		const stmt = this.db.prepare(this.sql);
		const result = stmt.get(...this.params) as T | undefined;
		return result ?? null;
	}

	run(): { meta: { changes: number } } {
		if (this.isPg) {
			const deasync = require('deasync');
			const pgSql = toPgPlaceholders(this.sql);
			const promise = this.db.query(pgSql, this.params);
			const res = deasync(promise);
			const changes = res.rowCount ?? 0;
			return { meta: { changes } };
		}
		const stmt = this.db.prepare(this.sql);
		const info = stmt.run(...this.params);
		return { meta: { changes: info.changes } };
	}
}

/**
 * D1-compatible database interface.
 */
export class D1Compat {
	private db: any;
	private isPg: boolean;

	constructor() {
		this.db = getConnection();
		this.isPg = _isPostgres;
	}

	prepare(sql: string): D1PreparedStatement {
		return new D1PreparedStatement(this.db, sql, this.isPg);
	}

	exec(sql: string): void {
		if (this.isPg) {
			const deasync = require('deasync');
			const promise = this.db.query(sql);
			deasync(promise);
			return;
		}
		this.db.exec(sql);
	}
}

let _instance: D1Compat | null = null;

export function getDB(): D1Compat {
	if (!_instance) {
		_instance = new D1Compat();
	}
	return _instance;
}
