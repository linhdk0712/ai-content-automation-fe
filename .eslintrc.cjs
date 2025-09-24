module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		ecmaFeatures: { jsx: true },
	},
	settings: {
		react: { version: 'detect' },
	},
	env: {
		browser: true,
		es2021: true,
		node: true,
	},
	plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react-hooks/recommended',
	],
	rules: {
		'@typescript-eslint/no-explicit-any': 'error',
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
		'no-unused-vars': 'off',
		'@typescript-eslint/ban-types': [
			'error',
			{
				extendDefaults: true,
				types: { Function: true },
			},
		],
		'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
		'react-hooks/exhaustive-deps': 'warn',
	},
	overrides: [
		{
			files: ['**/*.test.ts', '**/*.test.tsx'],
			env: { browser: true, node: true },
			globals: {
				vi: 'readonly',
				describe: 'readonly',
				it: 'readonly',
				expect: 'readonly',
				beforeEach: 'readonly',
				afterEach: 'readonly',
				beforeAll: 'readonly',
				afterAll: 'readonly',
			},
		},
		{
			files: ['cypress/**/*.ts', 'cypress/**/*.tsx', '**/*.cy.ts', '**/*.cy.tsx'],
			env: { browser: true, node: true },
			globals: {
				cy: 'readonly',
				Cypress: 'readonly',
				expect: 'readonly',
			},
		},
	],
};
