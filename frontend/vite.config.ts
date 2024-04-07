import { vitePlugin as remix } from '@remix-run/dev';
import { installGlobals } from '@remix-run/node';
import { resolve } from 'path';
import { flatRoutes } from 'remix-flat-routes';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const MODE = process.env.NODE_ENV;
installGlobals();

export default defineConfig({
	resolve: {
		preserveSymlinks: true,
	},
	build: {
		cssMinify: MODE === 'production',
		sourcemap: true,
		commonjsOptions: {
			include: [/frontend/, /backend/, /node_modules/],
		},
	},
	plugins: [
		// cjsInterop({
		// 	dependencies: ['remix-utils', 'is-ip', '@markdoc/markdoc'],
		// }),
		tsconfigPaths({}),
		remix({
			ignoredRouteFiles: ['**/*'],
			future: {
				v3_fetcherPersist: true,
			},

			// When running locally in development mode, we use the built in remix
			// server. This does not understand the vercel lambda module format,
			// so we default back to the standard build output.
			// ignoredRouteFiles: ['**/.*', '**/*.test.{js,jsx,ts,tsx}'],
			serverModuleFormat: 'esm',

			routes: async (defineRoutes) => {
				return flatRoutes("routes", defineRoutes, {
					ignoredRouteFiles: [
						".*",
						"**/*.css",
						"**/*.test.{js,jsx,ts,tsx}",
						"**/__*.*",
						// This is for server-side utilities you want to colocate next to
						// your routes without making an additional directory.
						// If you need a route that includes "server" or "client" in the
						// filename, use the escape brackets like: my-route.[server].tsx
						// 	'**/*.server.*',
						// 	'**/*.client.*',
					],
					// Since process.cwd() is the server directory, we need to resolve the path to remix project
					appDir: resolve(__dirname, "app"),
				});
			},
		}),
	],
});
