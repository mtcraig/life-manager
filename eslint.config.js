// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    // Electron's main/preload processes are conventionally plain CommonJS,
    // regardless of the rest of the repo being ESM ("type": "module").
    files: ['packages/desktop/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Node scripts (esbuild/rimraf build scripts, launching the packaged exe) -
    // these use process/console but stay real ESM, unlike the .cjs files above.
    files: ['packages/desktop/scripts/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
      },
    },
  },
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/data/**',
      '**/migrations/**',
      'packages/desktop/resources/**',
      'packages/desktop/release/**',
    ],
  },
);
