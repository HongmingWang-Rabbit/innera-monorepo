const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// pnpm monorepo: watch workspace packages (avoid watching the entire root to reduce FS watchers)
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages/shared'),
  path.resolve(monorepoRoot, 'packages/ui'),
  path.resolve(monorepoRoot, 'packages/app'),
  // NOTE: packages/db is intentionally excluded — it is server-only (uses `pg`, a Node.js native module)
  // and will cause Metro bundler errors if included.
  path.resolve(monorepoRoot, 'node_modules'),
];

// pnpm monorepo: tell Metro where to resolve modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Enable symlink support for pnpm's .pnpm store
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
