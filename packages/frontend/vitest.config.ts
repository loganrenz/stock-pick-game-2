import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    exclude: [
      'node_modules',
      'dist',
      'tests/e2e/**',
      'tests/tests/e2e/**',
      '**/e2e/**',
      '**/*.e2e.*',
      '**/playwright.config.*',
    ],
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup-env.ts'],
    sequence: {
      concurrent: false,
    },
    fileParallelism: false,
    globalSetup: './tests/global-setup.ts',
  },
}); 