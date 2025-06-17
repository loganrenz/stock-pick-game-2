import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/e2e/**', '**/tests/e2e/**', '**/node_modules/**'],
    globals: true,
    testMatch: ['**/tests/**/*.test.ts'],
    environmentMatchGlobs: [
      ['**/tests/api/**/*.test.ts', 'node'],
      ['**/tests/**/*.test.ts', 'jsdom']
    ]
  },
}); 