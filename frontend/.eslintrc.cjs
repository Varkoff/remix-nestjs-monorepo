/** @type {import("eslint").Linter.Config} */
module.exports = {
	root: true,
	extends: [
		'@virgile/eslint-config/base.js',
		'@remix-run/eslint-config',
		'@remix-run/eslint-config/node',
		// 'plugin:tailwindcss/recommended',
		'plugin:remix-react-routes/recommended',
	],
	settings: {
		// tailwindcss: {
		// 	config: 'tailwind.config.ts',
		// },
		'import/resolver': {
			node: {
				extensions: ['.js', '.jsx', '.ts', '.tsx'],
			},
		},
	},

	overrides: [
		{
			extends: ['@remix-run/eslint-config/jest-testing-library'],
			files: ['app/**/__tests__/**/*', 'app/**/*.{spec,test}.*'],
			rules: {
				'testing-library/no-await-sync-events': 'off',
				'jest-dom/prefer-in-document': 'off',
			},
			// we're using vitest which has a very similar API to jest
			// (so the linting plugins work nicely), but it means we have to explicitly
			// set the jest version.
			settings: {
				jest: {
					version: 28,
				},
			},
		},
	],
};
