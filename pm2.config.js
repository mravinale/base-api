module.exports = {
  apps : [{
    name   : "survey-api",
    script : "./dist/src/index.js",
    exec_mode: 'cluster',
    instances: 1,
    env: {
      NODE_ENV: "development"
    }
  }]
}
