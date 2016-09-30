const nWebpack = require('@financial-times/n-webpack');

const config = require('./n-makefile');

module.exports = nWebpack({
	withHeadCss: true,
	withHashedAssets: true,
	withBabelPolyfills: true,
	entry: config.assets.entry,
	includes: config.assets.includes
});
