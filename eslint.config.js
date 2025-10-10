import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import nextPlugin from '@next/eslint-plugin-next';
import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

export default [...compat.extends("next/core-web-vitals", "next/typescript"), {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "jest.setup.js"]
}, js.configs.recommended, {
  files: ['**/*.{js,jsx,ts,tsx}'],
  languageOptions: {
    parser: typescriptParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      console: 'readonly',
      process: 'readonly',
      Buffer: 'readonly',
      __dirname: 'readonly',
      __filename: 'readonly',
      global: 'readonly',
      module: 'readonly',
      require: 'readonly',
      exports: 'readonly',
      setInterval: 'readonly',
      setTimeout: 'readonly',
      clearInterval: 'readonly',
      clearTimeout: 'readonly',
      Response: 'readonly',
      Request: 'readonly',
      fetch: 'readonly',
      URL: 'readonly',
      File: 'readonly',
      FileReader: 'readonly',
      Blob: 'readonly',
      document: 'readonly',
      window: 'readonly',
      navigator: 'readonly',
      React: 'readonly',
      JSX: 'readonly',
      HTMLInputElement: 'readonly',
      HTMLDivElement: 'readonly',
      HTMLButtonElement: 'readonly',
      HTMLTextAreaElement: 'readonly',
      HTMLTableElement: 'readonly',
      HTMLTableSectionElement: 'readonly',
      HTMLTableRowElement: 'readonly',
      HTMLTableCellElement: 'readonly',
      HTMLTableCaptionElement: 'readonly',
      HTMLParagraphElement: 'readonly',
      HTMLHeadingElement: 'readonly',
      HTMLSpanElement: 'readonly',
      HTMLUListElement: 'readonly',
      HTMLLIElement: 'readonly',
      HTMLAnchorElement: 'readonly',
      KeyboardEvent: 'readonly',
      FormData: 'readonly',
      NodeJS: 'readonly',
             localStorage: 'readonly',
             URLSearchParams: 'readonly',
             google: 'readonly',
             alert: 'readonly',
             btoa: 'readonly',
             Image: 'readonly',
             performance: 'readonly',
    },
  },
  plugins: {
    '@typescript-eslint': typescript,
    '@next/next': nextPlugin,
  },
  rules: {
    ...typescript.configs.recommended.rules,
    ...nextPlugin.configs.recommended.rules,
    ...nextPlugin.configs['core-web-vitals'].rules,
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    'no-console': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-case-declarations': 'off',
    'react/no-unescaped-entities': 'off',
    'react/display-name': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'jsx-a11y/alt-text': 'warn',
  },
}, {
  files: ['**/*.js'],
  languageOptions: {
    sourceType: 'commonjs',
  },
}, {
  files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
  languageOptions: {
    globals: {
      describe: 'readonly',
      it: 'readonly',
      expect: 'readonly',
      beforeEach: 'readonly',
      afterEach: 'readonly',
      beforeAll: 'readonly',
      afterAll: 'readonly',
      jest: 'readonly',
      test: 'readonly',
      xtest: 'readonly',
      xit: 'readonly',
      fit: 'readonly',
      fdescribe: 'readonly',
      xdescribe: 'readonly',
    },
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    'no-console': 'off',
  },
}, {
  ignores: [
    'node_modules/**',
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    '*.config.js',
    '*.config.ts',
  ],
}];
