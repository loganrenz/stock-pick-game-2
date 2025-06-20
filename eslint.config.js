import js from '@eslint/js';
import * as tseslint from '@typescript-eslint/eslint-plugin';
import * as tsparser from '@typescript-eslint/parser';
import eslintPluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      vue: eslintPluginVue
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      ...tseslint.configs.recommended.rules
    }
  }
]; 