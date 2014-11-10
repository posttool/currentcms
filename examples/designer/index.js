
exports = module.exports = {
  config: require('./config'),
  models: require('../../lib/patterns/page/models'),
  workflow: require('../../lib/patterns/page/workflow'),
  permissions: require('../../lib/patterns/page/permission'),
  app: require('./app')
};


if (process.argv.length > 2) {
  var utils = require('../../lib/utils');
  switch (process.argv[2]) {
    case 'admin':
      utils.create_admin(module.exports);
      break;
    case 'start':
      utils.start_server(module.exports);
      break;
  }
}
