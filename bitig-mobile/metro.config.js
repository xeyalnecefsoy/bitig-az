const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

// Monorepo: parent repo (shared lib, etc.) must be watched so Metro picks up changes.
config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// @bitig/i18n is installed via `file:../lib` (see package.json) so it resolves from
// node_modules like any other package — more reliable than custom resolveRequest on Expo 55.

module.exports = config
