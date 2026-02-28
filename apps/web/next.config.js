const { withTamagui } = require('@tamagui/next-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    'react-native',
    'react-native-web',
    'solito',
    'expo-linking',
    'expo-modules-core',
    '@innera/ui',
    '@innera/app',
    '@innera/shared',
    'tamagui',
    '@tamagui/core',
    '@tamagui/config',
    '@tamagui/lucide-icons',
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': 'react-native-web',
    };
    config.resolve.extensions = [
      '.web.tsx', '.web.ts', '.web.js',
      ...config.resolve.extensions,
    ];
    // Allow ESM .js imports to resolve to .ts/.tsx source files in workspace packages
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      'react-native': 'react-native-web',
    },
    resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
  },
  experimental: {
    optimizePackageImports: ['tamagui', '@tamagui/core'],
  },
};

module.exports = withTamagui({
  config: '../../packages/ui/src/tamagui.config.ts',
  components: ['tamagui', '@innera/ui'],
  appDir: true,
  outputCSS: './styles/tamagui.css',
})(nextConfig);
