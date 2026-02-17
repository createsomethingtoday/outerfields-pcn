#!/usr/bin/env tsx
/**
 * Verify the app can connect to the database (Postgres or SQLite).
 * Run from project root:
 *   npx tsx scripts/check-db-connection.ts
 * On Replit, ensure DATABASE_URL is set in Secrets (for Postgres).
 * Locally, set DATABASE_URL in .env or in the shell to test Postgres.
 */

import { getDB } from '../src/lib/server/d1-compat';

function main() {
	const kind = process.env.DATABASE_URL?.startsWith('postgres') ? 'Postgres' : 'SQLite';
	console.log(`Database: ${kind}`);
	console.log('Connecting...');

	try {
		const db = getDB();
		const row = db.prepare('SELECT 1 as ok').first<{ ok: number }>();
		if (row?.ok === 1) {
			console.log('✅ Connected successfully.');
			// Optional: show a simple table count
			try {
				const users = db.prepare('SELECT COUNT(*) as n FROM users').first<{ n: number }>();
				console.log(`   users: ${users?.n ?? 0} rows`);
			} catch {
				// ignore if table missing
			}
			process.exit(0);
		}
	} catch (err) {
		console.error('❌ Connection failed:', (err as Error).message);
		process.exit(1);
	}

	console.error('❌ Unexpected result from SELECT 1');
	process.exit(1);
}

main();
