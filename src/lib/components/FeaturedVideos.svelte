<script lang="ts">
	/**
	 * OUTERFIELDS Featured Videos
	 *
	 * Admin-curated featured grid for the home page.
	 * Playback is resolved via /api/v1/videos/:id/playback (Stream HLS or legacy R2 MP4).
	 */
	import { Play, Eye } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { videoPlayer, type Video } from '$lib/stores/videoPlayer';
	import { videoStats } from '$lib/stores/videoStats';
	import { fetchVideoPlayback } from '$lib/client/video-playback';
	import { VIDEO_CDN_BASE } from '$lib/constants/video';

	interface FeaturedCard extends Video {}

	let videos = $state<FeaturedCard[]>([]);
	let isLoading = $state(true);
	let loadError = $state<string | null>(null);

	function formatClock(totalSeconds: number): string {
		const seconds = Math.max(0, Math.floor(totalSeconds));
		const hours = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		if (hours > 0) {
			return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
		}
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function getThumbnailPath(path: string): string {
		if (path.startsWith('/thumbnails/')) return path;
		return `/thumbnails${path.startsWith('/') ? '' : '/'}${path}`;
	}

	function toLegacyAssetUrl(path: string): string {
		if (path.startsWith('http://') || path.startsWith('https://')) return path;
		return `${VIDEO_CDN_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
	}

	interface FeaturedCatalogEntry {
		seriesTitle: string | null;
		seriesSlug: string | null;
		video: {
			id: string;
			title: string;
			tier: 'free' | 'preview' | 'gated';
			episode_number: number | null;
			duration_seconds: number | null;
			duration: number;
			thumbnail_path: string;
			series_id: string | null;
		};
	}

	function mapCatalogVideo(entry: FeaturedCatalogEntry): FeaturedCard {
		return {
			id: entry.video.id,
			title: entry.video.title,
			description: '',
			duration: formatClock(entry.video.duration_seconds ?? entry.video.duration),
			thumbnail: getThumbnailPath(entry.video.thumbnail_path),
			category: entry.seriesTitle || entry.seriesSlug || 'Featured',
			src: ''
		};
	}

	onMount(() => {
		videoStats.startPolling(10000);
		void loadFeaturedVideos();

		return () => {
			videoStats.stopPolling();
		};
	});

	async function loadFeaturedVideos() {
		try {
			isLoading = true;
			loadError = null;

			const response = await fetch('/api/v1/catalog/featured?limit=6');
			const payload = await response.json();
			if (!response.ok || !payload?.success) {
				throw new Error(payload?.error || 'Failed to load featured videos');
			}

			const rows = (payload.data?.videos || []) as FeaturedCatalogEntry[];
			videos = rows.map(mapCatalogVideo);
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Failed to load featured videos';
			videos = [];
		} finally {
			isLoading = false;
		}
	}

	async function playVideo(video: FeaturedCard) {
		try {
			const playback = await fetchVideoPlayback(video.id);
			let src: string | null = null;

			if (playback.status === 'ready' && playback.grant) {
				src = playback.grant.hlsUrl;
			}
			if (!src && playback.status === 'legacy' && playback.legacyAssetPath) {
				src = toLegacyAssetUrl(playback.legacyAssetPath);
			}

			if (!src) {
				loadError = playback.message || 'Playback is not ready yet.';
				return;
			}

			videoPlayer.play({
				id: video.id,
				title: video.title,
				description: video.description,
				duration: video.duration,
				thumbnail: video.thumbnail,
				category: video.category,
				src
			});
			videoStats.incrementView(video.id);
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Failed to start playback';
		}
	}

	function formatViews(views: number): string {
		if (views >= 1000000) {
			return `${(views / 1000000).toFixed(1)}M`;
		}
		if (views >= 1000) {
			return `${(views / 1000).toFixed(1)}K`;
		}
		return views.toLocaleString();
	}
</script>

<section class="videos-section" id="videos">
	<div class="videos-container">
		<div class="section-header">
			<span class="section-badge">Portfolio</span>
			<h2 class="section-title">Sample Productions</h2>
			<p class="section-description">
				Browse our work. Every PCN we build includes professional video production like this.
			</p>
		</div>

		<div class="videos-grid highlight-grid">
			{#if isLoading}
				<p class="empty-state">Loading featured videos…</p>
			{:else if loadError}
				<p class="empty-state">{loadError}</p>
			{:else if videos.length === 0}
				<p class="empty-state">No featured videos available.</p>
			{:else}
				{#each videos as video, index}
					<button
						class="video-card highlight-item"
						style="--index: {index}"
						onclick={() => playVideo(video)}
					>
						<div class="video-thumbnail">
							<img src={video.thumbnail} alt={video.title} loading="lazy" />
							<div class="video-overlay">
								<span class="play-button" aria-hidden="true">
									<Play size={32} />
								</span>
							</div>
							<span class="video-duration">{video.duration}</span>
						</div>
						<div class="video-info">
							<span class="video-category">{video.category}</span>
							<h3 class="video-title">{video.title}</h3>
							<p class="video-description">{video.description}</p>
							{#if $videoStats.views[video.id] !== undefined}
								<div class="video-views">
									<Eye size={14} />
									<span>{formatViews($videoStats.views[video.id])} views</span>
									{#if $videoStats.isLive}
										<span class="live-indicator" title="Real-time data from Cloudflare"></span>
									{/if}
								</div>
							{/if}
						</div>
					</button>
				{/each}
			{/if}
		</div>
	</div>
</section>

<style>
	.videos-section {
		padding: 6rem 1.5rem;
		background: var(--color-bg-pure);
	}

	.videos-container {
		max-width: var(--container-max-width);
		margin: 0 auto;
	}

	.section-header {
		text-align: center;
		margin-bottom: 4rem;
	}

	.section-badge {
		display: inline-block;
		padding: 0.375rem 0.75rem;
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-default);
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-fg-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 1rem;
	}

	.section-title {
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 700;
		color: var(--color-fg-primary);
		margin: 0 0 1rem;
	}

	.section-description {
		font-size: 1.125rem;
		color: var(--color-fg-muted);
		max-width: 36rem;
		margin: 0 auto;
		line-height: 1.7;
	}

	.videos-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.video-card {
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-default);
		border-radius: 1rem;
		overflow: hidden;
		cursor: pointer;
		text-align: left;
		transition: all var(--duration-micro) var(--ease-standard),
			opacity var(--duration-standard) var(--ease-standard),
			transform var(--duration-micro) var(--ease-standard);
		transition-delay: calc(var(--cascade-step, 50ms) * var(--index, 0));
	}

	.video-card:hover {
		border-color: var(--color-border-strong);
		transform: translateY(-4px) scale(1.02);
		opacity: 1 !important; /* Override highlight-grid opacity dimming */
	}

	.video-thumbnail {
		position: relative;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: #000;
	}

	.video-thumbnail img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		transform: scale(1.15);
		transition: transform var(--duration-standard) var(--ease-standard);
	}

	.video-card:hover .video-thumbnail img {
		transform: scale(1.25);
	}

	.video-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
		opacity: 0;
		transition: opacity var(--duration-standard) var(--ease-standard);
	}

	.video-card:hover .video-overlay {
		opacity: 1;
	}

	.play-button {
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 50%;
		color: var(--color-bg-pure);
	}

	.video-duration {
		position: absolute;
		bottom: 0.75rem;
		right: 0.75rem;
		padding: 0.25rem 0.5rem;
		background: rgba(0, 0, 0, 0.8);
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: white;
	}

	.video-info {
		padding: 1.25rem;
	}

	.video-category {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-fg-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: 0.5rem;
	}

	.video-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-fg-primary);
		margin: 0 0 0.5rem;
		line-height: 1.3;
	}

	.video-description {
		font-size: 0.875rem;
		color: var(--color-fg-secondary);
		margin: 0 0 0.75rem;
		line-height: 1.6;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.video-views {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: var(--color-fg-muted);
	}

	.live-indicator {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-sun);
		animation: pulse 1.5s infinite;
		margin-left: 0.25rem;
	}

	@keyframes pulse {
		0% { opacity: 0.3; }
		50% { opacity: 1; }
		100% { opacity: 0.3; }
	}

	.empty-state {
		grid-column: 1 / -1;
		text-align: center;
		color: var(--color-fg-muted);
		padding: 2rem;
	}

	@media (max-width: 768px) {
		.videos-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

