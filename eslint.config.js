import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'existing_proj']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['app.js', 'mock/**/*.js', 'config/**/*.js', 'controllers/**/*.js', 'jwt/**/*.js', 'middleware/**/*.js', 'models/**/*.js', 'routes/**/*.js', 'services/**/*.js', 'email/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
