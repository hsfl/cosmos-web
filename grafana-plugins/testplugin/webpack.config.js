const path = require('path');
const webpack = require('webpack');
const cesiumSource = '../node_modules/cesium/Source';
const cesiumWorkers = '../Build/Cesium/Workers/';
const CopywebpackPlugin = require('copy-webpack-plugin');

module.exports.getWebpackConfig = (config, options) => {
  //console.log('Use custom webpack config');
  return {
    ...config,
    output: {
      ...config.output,
      // Needed to compile multiline strings in Cesium
      sourcePrefix: '',
    },
    amd: {
      ...config.amd,
      // Enable webpack-friendly use of require in Cesium
      toUrlUndefined: true,
    },
    node: {
      ...config.node,
      // Resolve node module use of fs
      fs: 'empty',
    },
    resolve: {
      ...config.resolve,
      alias: {
        // CesiumJS module name
        //cesium: path.resolve(__dirname, cesiumSource)
      }
    },
    plugins: [
      ...config.plugins,
      // Copy Cesium Assets, Widgets, and Workers to a static directory
      new CopywebpackPlugin([
        { from: path.join(cesiumSource, cesiumWorkers), to: 'Cesium/Workers' },
        { from: path.join(cesiumSource, 'Assets'), to: 'Cesium/Assets' },
        { from: path.join(cesiumSource, 'Widgets'), to: 'Cesium/Widgets' }
      ]),
      new webpack.DefinePlugin({
        // Define relative base path in cesium for loading assets
        CESIUM_BASE_URL: JSON.stringify('/public/plugins/' + process.env.npm_package_name + '/Cesium')
      }),
    ],
  }
};
