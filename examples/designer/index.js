
exports = module.exports = {
  config: require('./config'),
  models: require('../modules/postera/models'),
  workflow: require('../modules/postera/workflow'),
  permissions: require('../modules/postera/permission'),
  app: require('./app')
};