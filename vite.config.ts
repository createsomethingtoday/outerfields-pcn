import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		// better-sqlite3 is a native Node module — must not be bundled by Vite
		external: ['better-sqlite3']
	}
});
