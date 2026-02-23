const { withTamagui } = require('@tamagui/next-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
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
    '@tamagui/animations-react-native',
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
    return config;
  },
  experimental: {
    optimizePackageImports: ['tamagui', '@tamagui/core'],
  },
};

module.exports = withTamagui({
  config: '../../packages/ui/src/tamagui.config.ts',
  components: ['tamagui', '@innera/ui'],
  appDir: true,
  outputCSS: './public/tamagui.css',
  ...nextConfig,
});
