const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules: {
      crypto: path.resolve(__dirname, 'shims/empty.js'),
      url: path.resolve(__dirname, 'shims/empty.js'),
      http: path.resolve(__dirname, 'shims/empty.js'),
      https: path.resolve(__dirname, 'shims/empty.js'),
      stream: path.resolve(__dirname, 'shims/empty.js'),
      zlib: path.resolve(__dirname, 'shims/empty.js'),
      'follow-redirects': path.resolve(__dirname, 'shims/empty.js'),
      'proxy-from-env': path.resolve(__dirname, 'shims/empty.js'),
    },
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'axios') {
        return {
          filePath: path.resolve(__dirname, 'node_modules/axios/dist/browser/axios.cjs'),
          type: 'sourceFile',
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
