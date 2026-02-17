import type { LayoutServerLoad } from './$types';
import { isAdminUser } from '$lib/server/admin';
import { resolveRuntimeEnv } from '$lib/server/env';

/**
 * OUTERFIELDS Root Layout Server Load
 *
 * Loads auth state from session for all pages
 */

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	const runtimeEnv = resolveRuntimeEnv(((platform as { env?: Record<string, string | undefined> } | undefined)?.env));
	// User is already set in locals by hooks.server.ts
	return {
		user: locals.user || null,
		isAdmin: isAdminUser(locals.user, runtimeEnv)
	};
};
