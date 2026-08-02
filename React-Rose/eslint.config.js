// eslint.config.js
import js from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,jsx,ts,tsx}'], // ✅ دعم JS/TS/React
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      react: pluginReact,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
]);
