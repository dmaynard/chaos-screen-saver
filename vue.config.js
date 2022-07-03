module.exports = {
  runtimeCompiler: true,
  configureWebpack: {
    externals: {
      experiments: {
        asyncWebAssembly: true,
      },
    },
  },
};
