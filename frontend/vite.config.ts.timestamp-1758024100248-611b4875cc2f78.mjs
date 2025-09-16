// ../frontend/vite.config.ts
import { vitePlugin as remix } from "file:///Users/algomax/dev/courses/remix-nestjs-monorepo/node_modules/@remix-run/dev/dist/index.js";
import { installGlobals } from "file:///Users/algomax/dev/courses/remix-nestjs-monorepo/node_modules/@remix-run/node/dist/index.js";
import { resolve } from "path";
import { flatRoutes } from "file:///Users/algomax/dev/courses/remix-nestjs-monorepo/node_modules/remix-flat-routes/dist/index.js";
import { defineConfig } from "file:///Users/algomax/dev/courses/remix-nestjs-monorepo/node_modules/vite/dist/node/index.js";
import tsconfigPaths from "file:///Users/algomax/dev/courses/remix-nestjs-monorepo/node_modules/vite-tsconfig-paths/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/algomax/dev/courses/remix-nestjs-monorepo/frontend";
var MODE = process.env.NODE_ENV;
installGlobals();
var vite_config_default = defineConfig({
  resolve: {
    preserveSymlinks: true
  },
  build: {
    cssMinify: MODE === "production",
    sourcemap: true,
    commonjsOptions: {
      include: [/frontend/, /backend/, /node_modules/]
    }
  },
  plugins: [
    // cjsInterop({
    // 	dependencies: ['remix-utils', 'is-ip', '@markdoc/markdoc'],
    // }),
    tsconfigPaths({}),
    remix({
      ignoredRouteFiles: ["**/*"],
      future: {
        v3_fetcherPersist: true
      },
      // When running locally in development mode, we use the built in remix
      // server. This does not understand the vercel lambda module format,
      // so we default back to the standard build output.
      // ignoredRouteFiles: ['**/.*', '**/*.test.{js,jsx,ts,tsx}'],
      serverModuleFormat: "esm",
      routes: async (defineRoutes) => {
        return flatRoutes("routes", defineRoutes, {
          ignoredRouteFiles: [
            ".*",
            "**/*.css",
            "**/*.test.{js,jsx,ts,tsx}",
            "**/__*.*"
            // This is for server-side utilities you want to colocate next to
            // your routes without making an additional directory.
            // If you need a route that includes "server" or "client" in the
            // filename, use the escape brackets like: my-route.[server].tsx
            // 	'**/*.server.*',
            // 	'**/*.client.*',
          ],
          // Since process.cwd() is the server directory, we need to resolve the path to remix project
          appDir: resolve(__vite_injected_original_dirname, "app")
        });
      }
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vZnJvbnRlbmQvdml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYWxnb21heC9kZXYvY291cnNlcy9yZW1peC1uZXN0anMtbW9ub3JlcG8vZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9hbGdvbWF4L2Rldi9jb3Vyc2VzL3JlbWl4LW5lc3Rqcy1tb25vcmVwby9mcm9udGVuZC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvYWxnb21heC9kZXYvY291cnNlcy9yZW1peC1uZXN0anMtbW9ub3JlcG8vZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyB2aXRlUGx1Z2luIGFzIHJlbWl4IH0gZnJvbSAnQHJlbWl4LXJ1bi9kZXYnO1xuaW1wb3J0IHsgaW5zdGFsbEdsb2JhbHMgfSBmcm9tICdAcmVtaXgtcnVuL25vZGUnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZmxhdFJvdXRlcyB9IGZyb20gJ3JlbWl4LWZsYXQtcm91dGVzJztcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocyc7XG5cbmNvbnN0IE1PREUgPSBwcm9jZXNzLmVudi5OT0RFX0VOVjtcbmluc3RhbGxHbG9iYWxzKCk7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG5cdHJlc29sdmU6IHtcblx0XHRwcmVzZXJ2ZVN5bWxpbmtzOiB0cnVlLFxuXHR9LFxuXHRidWlsZDoge1xuXHRcdGNzc01pbmlmeTogTU9ERSA9PT0gJ3Byb2R1Y3Rpb24nLFxuXHRcdHNvdXJjZW1hcDogdHJ1ZSxcblx0XHRjb21tb25qc09wdGlvbnM6IHtcblx0XHRcdGluY2x1ZGU6IFsvZnJvbnRlbmQvLCAvYmFja2VuZC8sIC9ub2RlX21vZHVsZXMvXSxcblx0XHR9LFxuXHR9LFxuXHRwbHVnaW5zOiBbXG5cdFx0Ly8gY2pzSW50ZXJvcCh7XG5cdFx0Ly8gXHRkZXBlbmRlbmNpZXM6IFsncmVtaXgtdXRpbHMnLCAnaXMtaXAnLCAnQG1hcmtkb2MvbWFya2RvYyddLFxuXHRcdC8vIH0pLFxuXHRcdHRzY29uZmlnUGF0aHMoe30pLFxuXHRcdHJlbWl4KHtcblx0XHRcdGlnbm9yZWRSb3V0ZUZpbGVzOiBbJyoqLyonXSxcblx0XHRcdGZ1dHVyZToge1xuXHRcdFx0XHR2M19mZXRjaGVyUGVyc2lzdDogdHJ1ZSxcblx0XHRcdH0sXG5cblx0XHRcdC8vIFdoZW4gcnVubmluZyBsb2NhbGx5IGluIGRldmVsb3BtZW50IG1vZGUsIHdlIHVzZSB0aGUgYnVpbHQgaW4gcmVtaXhcblx0XHRcdC8vIHNlcnZlci4gVGhpcyBkb2VzIG5vdCB1bmRlcnN0YW5kIHRoZSB2ZXJjZWwgbGFtYmRhIG1vZHVsZSBmb3JtYXQsXG5cdFx0XHQvLyBzbyB3ZSBkZWZhdWx0IGJhY2sgdG8gdGhlIHN0YW5kYXJkIGJ1aWxkIG91dHB1dC5cblx0XHRcdC8vIGlnbm9yZWRSb3V0ZUZpbGVzOiBbJyoqLy4qJywgJyoqLyoudGVzdC57anMsanN4LHRzLHRzeH0nXSxcblx0XHRcdHNlcnZlck1vZHVsZUZvcm1hdDogJ2VzbScsXG5cblx0XHRcdHJvdXRlczogYXN5bmMgKGRlZmluZVJvdXRlcykgPT4ge1xuXHRcdFx0XHRyZXR1cm4gZmxhdFJvdXRlcyhcInJvdXRlc1wiLCBkZWZpbmVSb3V0ZXMsIHtcblx0XHRcdFx0XHRpZ25vcmVkUm91dGVGaWxlczogW1xuXHRcdFx0XHRcdFx0XCIuKlwiLFxuXHRcdFx0XHRcdFx0XCIqKi8qLmNzc1wiLFxuXHRcdFx0XHRcdFx0XCIqKi8qLnRlc3Que2pzLGpzeCx0cyx0c3h9XCIsXG5cdFx0XHRcdFx0XHRcIioqL19fKi4qXCIsXG5cdFx0XHRcdFx0XHQvLyBUaGlzIGlzIGZvciBzZXJ2ZXItc2lkZSB1dGlsaXRpZXMgeW91IHdhbnQgdG8gY29sb2NhdGUgbmV4dCB0b1xuXHRcdFx0XHRcdFx0Ly8geW91ciByb3V0ZXMgd2l0aG91dCBtYWtpbmcgYW4gYWRkaXRpb25hbCBkaXJlY3RvcnkuXG5cdFx0XHRcdFx0XHQvLyBJZiB5b3UgbmVlZCBhIHJvdXRlIHRoYXQgaW5jbHVkZXMgXCJzZXJ2ZXJcIiBvciBcImNsaWVudFwiIGluIHRoZVxuXHRcdFx0XHRcdFx0Ly8gZmlsZW5hbWUsIHVzZSB0aGUgZXNjYXBlIGJyYWNrZXRzIGxpa2U6IG15LXJvdXRlLltzZXJ2ZXJdLnRzeFxuXHRcdFx0XHRcdFx0Ly8gXHQnKiovKi5zZXJ2ZXIuKicsXG5cdFx0XHRcdFx0XHQvLyBcdCcqKi8qLmNsaWVudC4qJyxcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdC8vIFNpbmNlIHByb2Nlc3MuY3dkKCkgaXMgdGhlIHNlcnZlciBkaXJlY3RvcnksIHdlIG5lZWQgdG8gcmVzb2x2ZSB0aGUgcGF0aCB0byByZW1peCBwcm9qZWN0XG5cdFx0XHRcdFx0YXBwRGlyOiByZXNvbHZlKF9fZGlybmFtZSwgXCJhcHBcIiksXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSxcblx0XHR9KSxcblx0XSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE2VixTQUFTLGNBQWMsYUFBYTtBQUNqWSxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLGVBQWU7QUFDeEIsU0FBUyxrQkFBa0I7QUFDM0IsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxtQkFBbUI7QUFMMUIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTSxPQUFPLFFBQVEsSUFBSTtBQUN6QixlQUFlO0FBRWYsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDM0IsU0FBUztBQUFBLElBQ1Isa0JBQWtCO0FBQUEsRUFDbkI7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNOLFdBQVcsU0FBUztBQUFBLElBQ3BCLFdBQVc7QUFBQSxJQUNYLGlCQUFpQjtBQUFBLE1BQ2hCLFNBQVMsQ0FBQyxZQUFZLFdBQVcsY0FBYztBQUFBLElBQ2hEO0FBQUEsRUFDRDtBQUFBLEVBQ0EsU0FBUztBQUFBO0FBQUE7QUFBQTtBQUFBLElBSVIsY0FBYyxDQUFDLENBQUM7QUFBQSxJQUNoQixNQUFNO0FBQUEsTUFDTCxtQkFBbUIsQ0FBQyxNQUFNO0FBQUEsTUFDMUIsUUFBUTtBQUFBLFFBQ1AsbUJBQW1CO0FBQUEsTUFDcEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLE1BTUEsb0JBQW9CO0FBQUEsTUFFcEIsUUFBUSxPQUFPLGlCQUFpQjtBQUMvQixlQUFPLFdBQVcsVUFBVSxjQUFjO0FBQUEsVUFDekMsbUJBQW1CO0FBQUEsWUFDbEI7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxVQU9EO0FBQUE7QUFBQSxVQUVBLFFBQVEsUUFBUSxrQ0FBVyxLQUFLO0FBQUEsUUFDakMsQ0FBQztBQUFBLE1BQ0Y7QUFBQSxJQUNELENBQUM7QUFBQSxFQUNGO0FBQ0QsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
