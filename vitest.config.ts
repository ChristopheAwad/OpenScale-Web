import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		environment: 'jsdom',
		include: ['tests/**/*.test.ts'],
		exclude: ['node_modules', '.svelte-kit', 'build'],
		setupFiles: ['tests/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/lib/**/*.ts', 'src/routes/api/**/*.ts'],
			exclude: ['src/lib/server/db.ts'] // Exclude initDb side effects
		}
	}
});
