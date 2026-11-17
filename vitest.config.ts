import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
	},
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node',
		// Tests can run on the host that serves the app: don't take every core (default is one per core).
		maxWorkers: process.env.VITEST_MAX_WORKERS || '25%',
	},
});
