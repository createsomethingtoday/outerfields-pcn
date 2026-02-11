/**
 * KV-Compatible In-Memory Store
 *
 * Mimics Cloudflare KV's get/put/delete API with TTL support.
 * Used for sessions (SESSIONS) and engagement stats (VIDEO_STATS).
 *
 * In production on Replit, this persists in memory for the lifetime
 * of the server process. For true persistence, could be swapped
 * for Redis or a SQLite table.
 */

interface KVEntry {
	value: string;
	expiresAt: number | null; // timestamp in ms, null = no expiry
}

export class KVCompat {
	private store: Map<string, KVEntry> = new Map();
	private name: string;

	constructor(name: string) {
		this.name = name;
	}

	async get(key: string): Promise<string | null> {
		const entry = this.store.get(key);
		if (!entry) return null;

		// Check TTL
		if (entry.expiresAt && Date.now() > entry.expiresAt) {
			this.store.delete(key);
			return null;
		}

		return entry.value;
	}

	async put(
		key: string,
		value: string,
		options?: { expirationTtl?: number }
	): Promise<void> {
		const expiresAt = options?.expirationTtl
			? Date.now() + options.expirationTtl * 1000
			: null;

		this.store.set(key, { value, expiresAt });
	}

	async delete(key: string): Promise<void> {
		this.store.delete(key);
	}

	/**
	 * List keys with optional prefix (used by stats endpoint)
	 */
	async list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }> {
		const keys: { name: string }[] = [];
		const now = Date.now();

		for (const [key, entry] of this.store) {
			// Skip expired
			if (entry.expiresAt && now > entry.expiresAt) {
				this.store.delete(key);
				continue;
			}

			if (!options?.prefix || key.startsWith(options.prefix)) {
				keys.push({ name: key });
			}
		}

		return { keys };
	}
}

// Singleton instances
let _sessions: KVCompat | null = null;
let _videoStats: KVCompat | null = null;

export function getSessions(): KVCompat {
	if (!_sessions) {
		_sessions = new KVCompat('SESSIONS');
	}
	return _sessions;
}

export function getVideoStats(): KVCompat {
	if (!_videoStats) {
		_videoStats = new KVCompat('VIDEO_STATS');
	}
	return _videoStats;
}
