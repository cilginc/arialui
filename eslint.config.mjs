import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'dist-electron', 'out', 'node_modules', 'extension'] },
  
  // JS Files
  {
    extends: [js.configs.recommended],
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
  },

  // TS Files
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
    },
  },

  // Renderer specific (React)
  {
    files: ['src/renderer/**/*.{ts,tsx,jsx,js}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  
  // Main/Preload/Configs specific (Node)
  {
    files: ['src/main/**/*.{ts,js}', 'src/preload/**/*.{ts,js}', '*.config.js', '*.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  }
);
