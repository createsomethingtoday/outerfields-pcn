import type { D1Compat } from '$lib/server/d1-compat';

export interface Video {
	id: string;
	title: string;
	category: string;
	episode_number: number | null;
	tier: 'free' | 'preview' | 'gated';
	duration: number;
	asset_path: string;
	thumbnail_path: string;
	description: string | null;
	created_at: number;
	updated_at: number;
}

export interface VideosResponse {
	videos: Video[];
	total: number;
}

/**
 * Get all videos, optionally filtered by category
 */
export async function getVideos(
	db: D1Compat,
	category?: string
): Promise<VideosResponse> {
	let query = 'SELECT * FROM videos';
	const params: string[] = [];

	if (category) {
		query += ' WHERE category = ?';
		params.push(category);
	}

	query += ' ORDER BY category, episode_number NULLS LAST, created_at';

	const result = db.prepare(query).bind(...params).all<Video>();

	return {
		videos: result.results || [],
		total: result.results?.length || 0
	};
}

/**
 * Get videos grouped by category
 */
export async function getVideosByCategory(db: D1Compat): Promise<Record<string, Video[]>> {
	const { videos } = await getVideos(db);

	const grouped: Record<string, Video[]> = {};

	for (const video of videos) {
		if (!grouped[video.category]) {
			grouped[video.category] = [];
		}
		grouped[video.category].push(video);
	}

	return grouped;
}

/**
 * Get a single video by ID
 */
export async function getVideoById(db: D1Compat, id: string): Promise<Video | null> {
	const result = db.prepare('SELECT * FROM videos WHERE id = ?').bind(id).first<Video>();

	return result || null;
}

/**
 * Get videos by tier (free, preview, gated)
 */
export async function getVideosByTier(
	db: D1Compat,
	tier: 'free' | 'preview' | 'gated'
): Promise<VideosResponse> {
	const result = db
		.prepare('SELECT * FROM videos WHERE tier = ? ORDER BY category, episode_number NULLS LAST')
		.bind(tier)
		.all<Video>();

	return {
		videos: result.results || [],
		total: result.results?.length || 0
	};
}

/**
 * Get free videos (first episodes + trailers)
 */
export async function getFreeVideos(db: D1Compat): Promise<VideosResponse> {
	return getVideosByTier(db, 'free');
}

/**
 * Search videos by title
 */
export async function searchVideos(db: D1Compat, query: string): Promise<VideosResponse> {
	const result = db
		.prepare('SELECT * FROM videos WHERE title LIKE ? ORDER BY category, episode_number NULLS LAST')
		.bind(`%${query}%`)
		.all<Video>();

	return {
		videos: result.results || [],
		total: result.results?.length || 0
	};
}
