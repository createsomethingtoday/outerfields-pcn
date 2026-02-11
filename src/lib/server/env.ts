/**
 * Environment Variable Access
 *
 * Replaces platform?.env?.KEY with env('KEY').
 * Uses process.env (populated by Replit Secrets or .env file).
 */

export function env(key: string): string | undefined {
	return process.env[key];
}
