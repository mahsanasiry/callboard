import js from '@eslint/js';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'coverage/**', 'next-env.d.ts', '.open-next/**'] },
  js.configs.recommended,
  ...nextVitals,
  ...nextTypescript,
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['**/*.config.{ts,mjs}', 'scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: { 'no-console': ['error', { allow: ['warn', 'error'] }] },
  },
];

export default eslintConfig;
