var config = {
  development: {
    name: 'Designer',
    serverPort: 3001,
    mongoConnectString: 'mongodb://localhost/designer',
    sessionSecret: 'aaa',

    storage: "cloudinary",
    cloudinaryConfig: { cloud_name: 'xxx', api_key: 'xxx', api_secret: 'xxx' }
  },
  production: {
    name: 'Designer',
    serverPort: 80,
    mongoConnectString: 'mongodb://localhost/designer',
    sessionSecret: 'aaa',

    storage: "cloudinary",
    cloudinaryConfig: { cloud_name: 'xxx', api_key: 'xxx', api_secret: 'xxx' }
  }
}

module.exports = config[process.env.NODE_ENV || 'development'];