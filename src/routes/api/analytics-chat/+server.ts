import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch }) => {
	// This app runs on Node (adapter-node) where Workers AI bindings are unavailable.
	// Keep this endpoint for backwards compatibility by proxying to the Claude-backed route.
	try {
		const body = await request.text();
		const response = await fetch('/api/analytics-chat-claude', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body
		});

		return response;
	} catch (error) {
		console.error('Analytics chat proxy error:', error);
		return json({ success: false, error: 'AI service not available' }, { status: 503 });
	}
};
