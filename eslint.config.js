import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      vue: eslintPluginVue
    },
    rules: {
      'vue/multi-word-component-names': 'off'
    }
  }
); 