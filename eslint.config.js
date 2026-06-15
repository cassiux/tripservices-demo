import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // CLAUDE.md: strict mode, no `any`. tsc blocks implicit any; this blocks explicit any.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  // Node context for config files and Playwright E2E specs.
  {
    files: ['vite.config.ts', 'playwright.config.ts', 'eslint.config.js', 'e2e/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  // Prettier last — turns off all formatting rules that would conflict.
  prettier,
)
