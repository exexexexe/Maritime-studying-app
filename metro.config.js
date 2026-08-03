const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// expo-sqlite on web (dev/testing vehicle only — the product target is native):
// wa-sqlite ships as wasm and needs SharedArrayBuffer headers.
config.resolver.assetExts.push('wasm');
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  },
};

module.exports = withNativeWind(config, { input: './src/global.css' });
