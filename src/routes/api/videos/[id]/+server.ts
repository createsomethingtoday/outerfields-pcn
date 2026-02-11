import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/d1-compat';
import { getVideoById } from '$lib/server/db/videos';

/**
 * GET /api/videos/[id]
 * Returns a single video by ID
 */
export const GET: RequestHandler = async ({ params }) => {
	const db = getDB();

	const { id } = params;

	if (!id) {
		throw error(400, 'Video ID is required');
	}

	try {
		const video = await getVideoById(db, id);

		if (!video) {
			throw error(404, 'Video not found');
		}

		return json({ success: true, data: video });
	} catch (err) {
		console.error('Error fetching video:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		return json({ error: 'Failed to fetch video' }, { status: 500 });
	}
};
