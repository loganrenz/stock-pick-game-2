module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@vue/typescript/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    parser: '@typescript-eslint/parser',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'vue/require-explicit-emits': 'warn',
    'vue/require-toggle-inside-transition': 'warn',
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/ban-types': ['error', {
      types: {
        '{}': false,
        'Function': false,
        'Object': false
      }
    }]
  },
  globals: {
    __APP_VERSION__: 'readonly',
    __BUILD_TIME__: 'readonly'
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'public/',
    '*.d.ts',
  ],
} 