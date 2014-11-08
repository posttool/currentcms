var config = {
  development: {
    name: 'Artist',
    serverPort: 3001,
    mongoConnectString: 'mongodb://localhost/artist',
    sessionSecret: 'fnidsi7 54kuhsh,ngf',

    storage: "cloudinary",
    cloudinaryConfig: { cloud_name: 'xxx', api_key: 'xxx', api_secret: 'xxx' }
  },
  production: {
    name: 'Artist',
    serverPort: 80,
    mongoConnectString: 'mongodb://localhost/artist',
    sessionSecret: 'fnidsi7 54kuhsh,ngf',

    storage: "cloudinary",
    cloudinaryConfig: { cloud_name: 'xxx', api_key: 'xxx', api_secret: 'xxx' }
  }
}

module.exports = config[process.env.NODE_ENV || 'development'];