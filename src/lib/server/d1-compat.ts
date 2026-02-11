/**
 * D1-Compatible SQLite Wrapper
 *
 * Wraps better-sqlite3 with an API surface matching Cloudflare D1,
 * so all existing .prepare().bind().all/first/run() calls work unchanged.
 */
import { readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

let _db: any = null;
let _initFailed = false;

/**
 * Get or create the singleton SQLite database connection.
 * On first call, runs all migrations from /migrations.
 */
function getConnection(): any {
	if (_db) return _db;
	if (_initFailed) throw new Error('Database initialization previously failed');

	try {
		// Dynamic import to avoid Vite bundling issues with native modules
		const Database = require('better-sqlite3');

		const dbPath = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'outerfields.db');

		// Ensure the data directory exists
		const dir = dbPath.substring(0, dbPath.lastIndexOf('/'));
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}

		_db = new Database(dbPath);

		// Enable WAL mode for better concurrency
		_db.pragma('journal_mode = WAL');

		// Run migrations
		runMigrations(_db);

		return _db;
	} catch (err) {
		_initFailed = true;
		console.error('[d1-compat] Failed to initialize SQLite:', err);
		throw err;
	}
}

/**
 * Run all migration files in order
 */
function runMigrations(db: any): void {
	const migrationsDir = join(process.cwd(), 'migrations');
	if (!existsSync(migrationsDir)) return;

	// Create migrations tracking table
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
		// Check if already applied
		const applied = db
			.prepare('SELECT 1 FROM _migrations WHERE name = ?')
			.get(file);

		if (applied) continue;

		const sql = readFileSync(join(migrationsDir, file), 'utf-8');

		try {
			db.exec(sql);
			db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
			console.log(`[migration] Applied: ${file}`);
		} catch (err) {
			console.error(`[migration] Failed: ${file}`, err);
			// Don't throw — let the app start even if a migration fails
		}
	}
}

/**
 * D1-compatible prepared statement wrapper.
 * Supports the .bind().all(), .bind().first(), .bind().run() chain.
 */
class D1PreparedStatement {
	private db: any;
	private sql: string;
	private params: unknown[] = [];

	constructor(db: any, sql: string) {
		this.db = db;
		this.sql = sql;
	}

	bind(...params: unknown[]): D1PreparedStatement {
		this.params = params;
		return this;
	}

	all<T = Record<string, unknown>>(): { results: T[] } {
		const stmt = this.db.prepare(this.sql);
		const results = stmt.all(...this.params) as T[];
		return { results };
	}

	first<T = Record<string, unknown>>(): T | null {
		const stmt = this.db.prepare(this.sql);
		const result = stmt.get(...this.params) as T | undefined;
		return result ?? null;
	}

	run(): { meta: { changes: number } } {
		const stmt = this.db.prepare(this.sql);
		const info = stmt.run(...this.params);
		return { meta: { changes: info.changes } };
	}
}

/**
 * D1-compatible database interface.
 * Drop-in replacement for Cloudflare D1Database.
 */
export class D1Compat {
	private db: any;

	constructor() {
		this.db = getConnection();
	}

	prepare(sql: string): D1PreparedStatement {
		return new D1PreparedStatement(this.db, sql);
	}

	exec(sql: string): void {
		this.db.exec(sql);
	}
}

// Singleton instance
let _instance: D1Compat | null = null;

export function getDB(): D1Compat {
	if (!_instance) {
		_instance = new D1Compat();
	}
	return _instance;
}
