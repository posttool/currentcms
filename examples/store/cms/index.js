exports = module.exports = {
  config: require('./config'),
  models: require('./models')
};


if (process.argv.length > 2) {
  var utils = require('../../../currentcms/lib/utils');
  switch (process.argv[2]) {
    case 'admin':
      utils.create_admin(module.exports);
      break;
    case 'start':
      utils.start_server(module.exports);
      // and ... remember to install dependencies - see https://github.com/aheckmann/gm
      require('../../../currentcms/lib/transcode')(module.exports.config);
      break;
  }
}
