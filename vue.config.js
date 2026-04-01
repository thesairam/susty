const { defineConfig } = require('@vue/cli-service')
const path = require('path')
module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack: config => {
    config.module
      .rule('js')
      .use('babel-loader')
      .tap(options => Object.assign({}, options, {
        cacheDirectory: path.resolve(__dirname, '.babel-cache')
      }))
  },
  configureWebpack: {
    cache: {
      type: 'filesystem',
      cacheDirectory: path.resolve(__dirname, '.webpack-cache')
    }
  }
})
