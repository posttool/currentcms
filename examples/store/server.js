/* welcome */

var fs = require('fs');
var http = require('http');
//var https = require('https');
//var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
//var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
//var credentials = {key: privateKey, cert: certificate};

var cluster = require('cluster');
var express = require('express');
var passport = require('passport');
var flash = require('connect-flash');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var current = require('../../currentcms');
var cms = new current.Cms(require('./cms'), false);
var config = require('./config');

if (cluster.isMaster && config.cluster) {
  var cpuCount = require('os').cpus().length;
  for (var i = 0; i < cpuCount; i += 1)
    cluster.fork();
} else {

  // initialize passport strategies
  require('./auth/passport')(passport, cms.meta.model('Customer'), config);

  var server = express();
  server.use(morgan(process.env.NODE_ENV || 'dev'));
  server.use(cookieParser());
  server.use(bodyParser.urlencoded({ extended: true }));
  server.use(bodyParser.json());
  server.set('view engine', 'ejs');
  server.use(express.static(__dirname + '/public'));

  server.use(session({
    secret: config.session.secret,
    store: new MongoStore({
      db: config.session.db
    }),
    resave: true,
    saveUninitialized: true
  }));

  // initialize passport
  server.use(passport.initialize());
  server.use(passport.session());

  // flash for message & user in req locals
  server.use(flash());
  server.use(function (req, res, next) {
    res.locals.user = req.user;
    next();
  });

  // add passport routes
  server.use(require('./auth/routes.js')(passport));

  // add site routes
  require('./routes.js')(server, cms);

  var httpServer = http.createServer(server);
  httpServer.listen(config.ports.site);
  console.log('listening on port '+config.ports.site);
  //var httpsServer = https.createServer(credentials, server);
  //httpsServer.listen(config.securePorts.site);
}

if (config.cluster)
  cluster.on('exit', function (worker) {
    console.log('Worker ' + worker.id + ' died :(');
    cluster.fork();
  });
