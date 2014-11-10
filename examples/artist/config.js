var config = {
  development: {
    name: 'Artist',
    serverPort: 3001,
    mongoConnectString: 'mongodb://localhost/artist',
    sessionSecret: 'secretlyish',
    storage: "cloudinary",
    cloudinaryConfig: { cloud_name: 'xxx', api_key: 'xxx', api_secret: 'xxx' }
  },
  production: {
    name: 'Artist',
    serverPort: 80,
    mongoConnectString: 'mongodb://localhost/artist',
    sessionSecret: 'secretlyish',
    storage: "cloudinary",
    cloudinaryConfig: { cloud_name: 'xxx', api_key: 'xxx', api_secret: 'xxx' }
  }
}

module.exports = config[process.env.NODE_ENV || 'development'];