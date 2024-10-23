module.exports = {
  apps : [{
    name   : "base-api",
    script : "./dist/src/index.js",
    exec_mode: 'cluster',
    instances: 1,
    env: {
      NODE_ENV: "development"
    }
  }]
}
