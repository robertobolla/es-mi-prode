const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Agregamos las extensiones modernas que requieren dependencias como socket.io-client
config.resolver.sourceExts.push('mjs', 'cjs');

// Para manejar mejor las exportaciones de ESM en módulos de Node.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
