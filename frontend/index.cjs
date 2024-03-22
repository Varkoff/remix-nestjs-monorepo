const path = require('node:path');

let devServer;
const SERVER_DIR = path.join(__dirname, 'build/server/index.js');
const PUBLIC_DIR = path.join(__dirname, 'build/client');

module.exports.getPublicDir = function getPublicDir() {
	return PUBLIC_DIR;
};

module.exports.getServerBuild = async function getServerBuild() {
	if (process.env.NODE_ENV === 'production' || devServer === null) {
		return import(SERVER_DIR);
	}
	const ssrModule = await devServer.ssrLoadModule('virtual:remix/server-build');
	return ssrModule;
};

module.exports.startDevServer = async function startDevServer(app) {
	if (process.env.NODE_ENV === 'production') return;
	const vite = await import('vite');
	devServer = await vite.createServer({
		server: { middlewareMode: 'true' },
		root: __dirname,
	});

	app.use(devServer.middlewares);
	return devServer;
	// ...continues
};
