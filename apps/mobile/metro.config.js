const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch specific package directories (not the entire monorepo root to avoid excessive watching)
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages/app'),
  path.resolve(monorepoRoot, 'packages/ui'),
  path.resolve(monorepoRoot, 'packages/shared'),
];

// Ensure Metro can resolve modules from the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Disable hierarchical lookup to avoid issues with multiple react-native versions
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
