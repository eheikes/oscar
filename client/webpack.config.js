const path = require('path');

module.exports = {
  entry: [
    'whatwg-fetch',
    './src/main.ts',
  ],
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
    loaders: [{
      test: /\.ts$/,
      exclude: /node_modules|vue\/src/,
      loader: 'ts-loader',
      options: {
        appendTsSuffixTo: [/\.vue$/]
      },
    }, {
      test: /\.vue$/,
      loader: 'vue-loader',
      options: {
        esModule: true
      }
    }]
  }
};
