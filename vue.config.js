module.exports = {
  runtimeCompiler: true,
  configureWebpack: {
    externals: {
      experiments: {
        asyncWebAssembly: false,
      },
    },
  },
};
