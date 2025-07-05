// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // ✅ Entry point of your app
  entry: './src/index.js',

  // ✅ Output settings
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true, // Clears old files from dist
  },

  // ✅ Enable caching for faster rebuilds
  cache: {
    type: 'filesystem',
  },

  // ✅ Dev Server with hot reload
  devServer: {
    static: './dist',
    hot: true,
    open: true,
    port: 3000,
  },

  // ✅ Module rules
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/, // Don't recompile dependencies
        use: [
          'thread-loader', // Multi-threaded processing
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true, // Cache babel output
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'], // CSS support
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset/resource', // Image support
      },
    ],
  },

  // ✅ Plugins
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],

  // ✅ Optimization for lazy loading + caching
  optimization: {
    splitChunks: {
      chunks: 'all', // Automatically split vendor + app code
    },
  },

  // ✅ Set mode
  mode: 'development', // change to 'production' for deployment
};
