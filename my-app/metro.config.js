const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ignorar directorios problemáticos y temporales de Metro
config.watchFolders = [];
config.resolver = {
  ...config.resolver,
  blacklistRE: /node_modules\/\.metro-babel-transformer-.*/,
};

// Ignorar directorios específicos en el watcher
config.watcher = {
  ...config.watcher,
  watchman: {
    ...config.watcher?.watchman,
    ignore_dirs: [
      'node_modules/.metro-babel-transformer-CoAoVRHI',
    ],
  },
};

module.exports = config;
