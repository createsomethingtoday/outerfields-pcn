/**
 * Video View Increment API
 *
 * Increments view count for a video in Cloudflare KV
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getVideoStats } from '$lib/server/kv-compat';

// Default starting views
const DEFAULT_VIEWS: Record<string, number> = {
	v1: 1247,
	v2: 892,
	v3: 2156,
	v4: 634,
	v5: 1089
};

export const POST: RequestHandler = async ({ params }) => {
	const { id } = params;
	const kv = getVideoStats();

	if (!id) {
		return json({ error: 'Video ID required' }, { status: 400 });
	}

	const key = `views:${id}`;
	const current = await kv.get(key);
	const currentViews = current ? parseInt(current, 10) : DEFAULT_VIEWS[id] || 0;
	const newViews = currentViews + 1;

	await kv.put(key, newViews.toString());

	return json({ id, views: newViews, live: true });
};
