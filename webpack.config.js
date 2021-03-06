const path = require('path');

module.exports = {
  mode: 'development',
  entry: path.resolve('./entry.js'),
  module: {
    rules: [
      {test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/},
      {test: /\.svg$/, loader: 'svg-inline-loader'},
      {
        test: /\.(frag|vert|glsl)$/,
        use: [
          {
            loader: 'glsl-shader-loader',
            options: {}
          }
        ]
      }
    ]
  },
  devtool: 'inline-source-map',
  devServer: {
    host: '127.0.0.1',
    port: 9001,
    publicPath: '/dist/',
    contentBase: path.resolve('./'),
    compress: true,
    open: true,
    watchContentBase: false
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve('dist')
  }
}