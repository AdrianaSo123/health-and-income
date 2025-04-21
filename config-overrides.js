module.exports = function override(config, env) {
  // Add CSV file loader
  config.module.rules.push({
    test: /\.csv$/,
    loader: 'raw-loader',
  });

  return config;
};
