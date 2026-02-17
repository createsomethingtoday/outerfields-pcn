#!/usr/bin/env tsx
/**
 * Create a user in the database (Postgres or SQLite), if it doesn't exist.
 *
 * Usage:
 *   npx tsx scripts/create-user.ts --email aaron@outerfields.co --name "Aaron" --password "choose-a-password" --membership 1
 *
 * Notes:
 * - Emails are normalized to lower-case.
 * - Password hashing matches the app (SHA-256 hex).
 * - Timestamps use ms (Date.now()) to match auth endpoints.
 */

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { getDB } from '../src/lib/server/d1-compat';

function getArg(name: string): string | undefined {
	const prefix = `--${name}`;
	const raw = process.argv.slice(2);

	for (let i = 0; i < raw.length; i++) {
		const token = raw[i] || '';
		if (token === prefix) return raw[i + 1];
		if (token.startsWith(`${prefix}=`)) return token.slice(prefix.length + 1);
	}

	return undefined;
}

function parseMembership(value: string | undefined): 0 | 1 {
	if (!value) return 0;
	const normalized = value.trim().toLowerCase();
	if (normalized === '1' || normalized === 'true' || normalized === 'yes') return 1;
	return 0;
}

function sha256Hex(value: string): string {
	return createHash('sha256').update(value, 'utf8').digest('hex');
}

function generatePassword(): string {
	// 16 bytes -> 32 hex chars
	return randomBytes(16).toString('hex');
}

async function main() {
	const emailRaw = getArg('email') || process.env.USER_EMAIL || process.env.ADMIN_USER_EMAIL;
	const nameRaw = getArg('name') || process.env.USER_NAME || process.env.ADMIN_USER_NAME;
	const passwordRaw = getArg('password') || process.env.USER_PASSWORD || process.env.ADMIN_USER_PASSWORD;
	const membershipRaw = getArg('membership') || process.env.USER_MEMBERSHIP || process.env.ADMIN_USER_MEMBERSHIP;

	if (!emailRaw?.trim()) {
		console.error('❌ Missing --email');
		process.exit(1);
	}
	if (!nameRaw?.trim()) {
		console.error('❌ Missing --name');
		process.exit(1);
	}

	const email = emailRaw.trim().toLowerCase();
	const name = nameRaw.trim();
	const membership = parseMembership(membershipRaw);

	const password = passwordRaw?.trim() || generatePassword();
	const passwordHash = sha256Hex(password);

	const db = getDB();

	const existing = db
		.prepare('SELECT id, email, name, membership, created_at FROM users WHERE lower(email) = ? LIMIT 1')
		.bind(email)
		.first<{ id: string; email: string; name: string; membership: unknown; created_at: number }>();

	if (existing) {
		console.log('✅ User already exists:');
		console.log(`   id: ${existing.id}`);
		console.log(`   email: ${existing.email}`);
		console.log(`   name: ${existing.name}`);
		process.exit(0);
	}

	const userId = randomUUID();
	const now = Date.now();

	db.prepare(
		`INSERT INTO users (id, email, password_hash, name, membership, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
	)
		.bind(userId, email, passwordHash, name, membership, now, now)
		.run();

	console.log('✅ Created user:');
	console.log(`   id: ${userId}`);
	console.log(`   email: ${email}`);
	console.log(`   name: ${name}`);
	console.log(`   membership: ${membership === 1 ? 'true' : 'false'}`);

	if (!passwordRaw?.trim()) {
		console.log('');
		console.log('🔐 Generated password (store this securely):');
		console.log(`   ${password}`);
	}
}

main().catch((err) => {
	console.error('❌ Failed:', (err as Error).message);
	process.exit(1);
});
