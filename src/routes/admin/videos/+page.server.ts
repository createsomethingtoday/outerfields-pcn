import type { PageServerLoad } from './$types';
import { getDB } from '$lib/server/d1-compat';
import { listAdminSeries } from '$lib/server/db/series';
import { listAdminVideos } from '$lib/server/db/videos';

export const load: PageServerLoad = async () => {
	const db = getDB();

	const [series, videos] = await Promise.all([
		listAdminSeries(db),
		listAdminVideos(db, { limit: 200, offset: 0 })
	]);

	return {
		series,
		videos: videos.videos,
		total: videos.total
	};
};

