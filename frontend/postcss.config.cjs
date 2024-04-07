const path = require('path');
/** @type {import('postcss-load-config').Config} */
module.exports = {
	plugins: {
		tailwindcss: {
			config: path.resolve(__dirname, 'tailwind.config.cjs'),
		},
		autoprefixer: {},
	},
};
