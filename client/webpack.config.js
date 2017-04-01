const path = require('path');

module.exports = {
  entry: [
    'whatwg-fetch',
    'jquery',
    'material-design-icons-loader',
    'materialize-loader!./materialize.config.js', // CSS
    'materialize-css', // JS
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
      test: /\.css$/,
      loader: ['style-loader', 'css-loader']
    }, {
      test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'url-loader?limit=10000&mimetype=application/font-woff'
    }, {
      test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'file-loader'
    }, {
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
