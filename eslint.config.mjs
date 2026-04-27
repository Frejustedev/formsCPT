import { defineConfig } from 'eslint/config';
import next from 'eslint-config-next';
import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default defineConfig([
  {
    ignores: ['dist/**/*', '.next/**/*', 'node_modules/**/*', 'public/sw.js', 'coverage/**/*'],
  },
  {
    extends: [...next],
    rules: {
      'react/no-unescaped-entities': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  firebaseRulesPlugin.configs['flat/recommended'],
]);
