module.exports = {
  publicPath: '',
  runtimeCompiler: true,
  configureWebpack: {
    externals: {
      experiments: {
        asyncWebAssembly: true,
      },
    },
  },
};
