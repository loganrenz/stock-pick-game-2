import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const buildTime = new Date().toISOString();
const version = process.env.npm_package_version;

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: '/',
  build: {
    sourcemap: true,
    minify: 'terser',
    terserOptions: {},
    rollupOptions: {
      output: {
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
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
})
