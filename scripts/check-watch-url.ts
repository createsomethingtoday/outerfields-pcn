#!/usr/bin/env tsx
/**
 * Check that a video can be resolved at /watch/[id].
 * Run from project root: pnpm tsx scripts/check-watch-url.ts [videoId]
 * Default videoId: vid_lmc_continental
 */

import { getDB } from '../src/lib/server/d1-compat';
import { getVideoById } from '../src/lib/server/db/videos';

const videoId = process.argv[2] ?? 'vid_lmc_continental';

async function main() {
	const db = getDB();
	const video = await getVideoById(db, videoId);

	if (!video) {
		console.error(`❌ Video not found for id: ${videoId}`);
		console.error('   URL /watch/' + videoId + ' would 404.');
		process.exit(1);
	}

	console.log(`✅ Video found: ${video.title}`);
	console.log(`   URL: /watch/${video.id}`);
	console.log(`   Tier: ${video.tier}, Category: ${video.category}`);
	console.log(`   Asset: ${video.asset_path}`);
	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
