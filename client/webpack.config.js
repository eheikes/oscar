const path = require('path');

module.exports = {
  entry: './src/app.ts',
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'vue': 'vue/dist/vue.common.js'
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build')
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ]
  }
};
