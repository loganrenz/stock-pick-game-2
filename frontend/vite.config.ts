import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: '/',
  build: {
    sourcemap: 'inline',
    minify: 'terser',
    terserOptions: {
      sourceMap: true,
    },
    rollupOptions: {
      output: {
        sourcemap: true,
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:4556',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    reporters: ['default', ['junit', { outputFile: './tests/results/junit.xml' }]],
    outputFile: './tests/results/vitest-report.txt',
    resolveSnapshotPath: (testPath, snapshotExtension) =>
      testPath.replace(/src\//, 'tests/__snapshots__/') + snapshotExtension,
  },
})
