<script lang="ts">
	/**
	 * OUTERFIELDS Client Reviews
	 *
	 * Real testimonials from PCN partners and clients.
	 */
	import { Quote } from 'lucide-svelte';

	interface Review {
		id: string;
		quote: string;
		name: string;
		organization: string;
		placeholder?: boolean;
	}

	const reviews: Review[] = [
		{
			id: 'gotv',
			quote: 'Outerfields is like the Greg Popovich of production.',
			name: 'Guns Out TV',
			organization: 'GOTV'
		},
		{
			id: 'rr-therapy',
			quote: 'Review coming soon.',
			name: 'Reconnecting Relationships',
			organization: 'Reconnecting Relationships Therapy',
			placeholder: true
		}
	];
</script>

<section class="reviews-section" id="reviews">
	<div class="reviews-container">
		<div class="section-header">
			<span class="section-badge">
				<Quote size={12} />
				Client Reviews
			</span>
			<h2 class="section-title">What Our Partners Say</h2>
			<p class="section-description">
				Hear from the creators and brands building with Outerfields.
			</p>
		</div>

		<div class="reviews-grid">
			{#each reviews as review}
				<div class="review-card" class:placeholder={review.placeholder}>
					<div class="quote-icon">
						<Quote size={28} />
					</div>
					<blockquote class="review-quote">
						{#if review.placeholder}
							<em>{review.quote}</em>
						{:else}
							"{review.quote}"
						{/if}
					</blockquote>
					<div class="review-attribution">
						<div class="review-avatar">
							{review.name.charAt(0)}
						</div>
						<div class="review-info">
							<p class="review-name">{review.name}</p>
							<p class="review-org">{review.organization}</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.reviews-section {
		padding: 6rem 1.5rem;
	}

	.reviews-container {
		max-width: var(--container-max-width);
		margin: 0 auto;
	}

	.section-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.section-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: var(--color-primary-muted);
		border: 1px solid rgba(244, 81, 38, 0.3);
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-sun);
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
		color: var(--color-slate);
		max-width: 36rem;
		margin: 0 auto;
		line-height: 1.6;
	}

	.reviews-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 2rem;
		max-width: 52rem;
		margin: 0 auto;
	}

	.review-card {
		padding: 2.5rem;
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-default);
		border-radius: 1rem;
		transition: border-color var(--duration-micro) var(--ease-standard);
	}

	.review-card:hover {
		border-color: var(--color-sun);
	}

	.review-card.placeholder {
		opacity: 0.6;
		border-style: dashed;
	}

	.quote-icon {
		color: var(--color-sun);
		margin-bottom: 1.25rem;
		opacity: 0.6;
	}

	.review-quote {
		font-size: 1.25rem;
		font-weight: 500;
		color: var(--color-fg-primary);
		line-height: 1.5;
		margin: 0 0 1.5rem;
	}

	.review-attribution {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.review-avatar {
		width: 2.75rem;
		height: 2.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-primary-muted);
		border-radius: 50%;
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-sun);
	}

	.review-info {
		display: flex;
		flex-direction: column;
	}

	.review-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-fg-primary);
		margin: 0;
	}

	.review-org {
		font-size: 0.875rem;
		color: var(--color-slate);
		margin: 0;
	}

	@media (max-width: 640px) {
		.reviews-section {
			padding: 4rem 1rem;
		}

		.reviews-grid {
			grid-template-columns: 1fr;
		}

		.review-card {
			padding: 1.75rem;
		}

		.review-quote {
			font-size: 1.125rem;
		}
	}
</style>
