import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  {
    ignores: [
      'old/backend/generated/',
      'old/backend/prisma/generated/',
      'dist/',
      'build/',
      'node_modules/',
      'coverage/',
      '.cache/',
      '.eslintcache',
      '.env*',
    ],
  },
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx,cts,mts,vue}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        __APP_VERSION__: 'readonly',
        __BUILD_TIME__: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // Add your custom TypeScript rules here
    },
  },
  eslintConfigPrettier,
]; 