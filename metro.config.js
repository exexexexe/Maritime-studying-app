const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// expo-sqlite on web (dev/testing vehicle only — the product target is native):
// wa-sqlite ships as wasm and needs SharedArrayBuffer headers.
config.resolver.assetExts.push('wasm');
// Bundled theory book (assets/theory-book.pdf) — Metro only treats a
// require()'d file as a static asset (rather than trying to parse it as
// source) when its extension is registered here.
config.resolver.assetExts.push('pdf');
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  },
};

module.exports = withNativeWind(config, { input: './src/global.css' });
