var config = {
  development: {
    ports: {
      cms: 3002,
      message: 3003,
      kue: 3004,
      site: 5000
    },
    cluster: false,
    session: {
      secret: 'notsecret',
      db: 'store-sessions'
    },

    api_endpoint: 'http://localhost:###/',
    /* http://gadgets.ndtv.com/apps/features/how-to-remove-facebook-twitter-gmail-linkedin-dropbox-app-permissions-574272 */
    facebookAuth: {
      clientID: 'xxx',
      clientSecret: 'xxx',
      callbackURL: 'http://localhost:###/auth/facebook/callback'
    },
    twitterAuth: {
      consumerKey: 'xxx',
      consumerSecret: 'xxx',
      callbackURL: 'http://localhost:###/auth/twitter/callback'
    },
    googleAuth: {
      clientID: 'xxxxx.apps.googleusercontent.com',
      clientSecret: 'xxxxx',
      callbackURL: 'http://localhost:###/auth/google/callback'
    }
  },

  production: {
    ports: {
      cms: 3002,
      message: 3003,
      kue: 3004,
      site: 80
    },
    cluster: true
    /* etc */

  }
}


exports = module.exports = config[process.env.NODE_ENV || 'development'];
