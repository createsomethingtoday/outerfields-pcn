import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessions } from '$lib/server/kv-compat';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		// Get session token from cookie
		const sessionToken = cookies.get('session_token');

		// Delete session from KV if it exists
		if (sessionToken) {
			const sessions = getSessions();
			await sessions.delete(`session:${sessionToken}`);
		}

		// Clear session cookie
		cookies.delete('session_token', { path: '/' });

		return json({ success: true });
	} catch (err) {
		console.error('Logout error:', err);
		return json({ success: false, error: 'Logout failed' }, { status: 500 });
	}
};
