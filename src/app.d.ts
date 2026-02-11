// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: {
				id: string;
				email: string;
				name: string;
				membership: boolean;
				createdAt: string;
				role?: string;
			};
		}
		// interface PageData {}
		// interface PageState {}
		// Platform is unused with adapter-node — we use our own env/db modules
	}
}

export {};
