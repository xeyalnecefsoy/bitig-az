module.exports = function (api) {
  api.cache(true)
  return {
    // NativeWind ships as a preset (it expands into multiple plugins).
    // Putting it under `plugins` triggers: ".plugins is not a valid Plugin property".
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [],
  }
}

