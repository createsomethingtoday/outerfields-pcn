import type { LayoutServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { isAdminUser } from '$lib/server/admin';

/**
 * Admin Route Guard
 *
 * - Redirects unauthenticated users to login with ?redirect=/admin/...
 * - Returns 403 for authenticated but non-admin users
 */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(302, `/login?redirect=${encodeURIComponent(`${url.pathname}${url.search}`)}`);
	}

	if (!isAdminUser(locals.user, process.env)) {
		throw error(403, 'Admin access required');
	}

	return {
		user: locals.user,
		isAdmin: true
	};
};

