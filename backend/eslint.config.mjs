// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      "prettier/prettier": ["error", { endOfLine: "auto" }],
      // Logging rules (docs/coding-principles.md §4): structured lines through the
      // logger, a fixed message with the data in the object. These three forms all
      // slip past redaction, so they are errors, not warnings.
      'no-console': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.property.name=/^(trace|debug|info|log|warn|error|fatal)$/][callee.object.property.name=/^logger$/] > TemplateLiteral",
          message: 'Keep the log message fixed: put values in the object (logger.info({ id }, "message")).',
        },
        {
          selector:
            "CallExpression[callee.property.name=/^(trace|debug|info|log|warn|error|fatal)$/][callee.object.name=/^logger$/] > TemplateLiteral",
          message: 'Keep the log message fixed: put values in the object (logger.info({ id }, "message")).',
        },
        {
          selector:
            "CallExpression[callee.property.name=/^(trace|debug|info|log|warn|error|fatal)$/][callee.object.property.name=/^logger$/] > BinaryExpression[operator='+'], CallExpression[callee.property.name=/^(trace|debug|info|log|warn|error|fatal)$/][callee.object.name=/^logger$/] > BinaryExpression[operator='+']",
          message: 'Keep the log message fixed: put values in the object, not string concatenation.',
        },
        {
          selector: "CallExpression[callee.property.name='child'][callee.object.property.name=/^logger$/], CallExpression[callee.property.name='child'][callee.object.name=/^logger$/]",
          message: 'No logger.child bindings: they bypass the log allow-list. Put the fields on each line.',
        },
      ],
    },
  },
  {
    // Tests assert on untyped HTTP bodies and build stubs freely.
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
);
