var pconfig = require('../config');
var config = {
  development: {
    name: 'Store',
    serverPort: pconfig.ports.cms,
    mongoConnectString: 'mongodb://localhost/store',
    sessionSecret: 'xxx',
    storage: "pkgcloud",
    pkgcloudConfig: {
      provider: 'rackspace',
      username: 'xxx',
      apiKey: 'xxx',
      region: 'IAD'
    },
    container: 'store-1',
    containerHttp: 'http://xxxxxxx.rackcdn.com',
    kueConfig: {
      redis: {
        port: 6379,
        host: '127.0.0.1'
        // for production? {  disableSearch: true }
      }
    },
    kueAdminPort: pconfig.ports.kue
  },
  production: {
    name: 'Store',
    serverPort: pconfig.ports.cms,
    mongoConnectString: 'mongodb://localhost/store',
    sessionSecret: 'y7dfy77gyfd7yy73rjjfd',
    storage: "pkgcloud"
  }
}

module.exports = config[process.env.NODE_ENV || 'development'];