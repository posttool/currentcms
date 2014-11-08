var express = require('express');
var mongoose = require('mongoose');

var current = require('../modules/cms');

var hm = require('./'),
    PUBLISHED = hm.workflow.PUBLISHED,
    config = hm.config;

// connect to db

var connection = mongoose.createConnection(config.mongoConnectString);
connection.on('error',function(){
  console.log('noooo '+config.mongoConnectString)
});

// serve express app
exports = module.exports = function() {
  var app = express();
  app.set('view engine', 'ejs');
  app.set('views',__dirname + '/views');
  app.use(express.static(__dirname + '/public'));
  //app.use(favicon(__dirname + '/public/favicon.ico'));
  app.use(express.urlencoded());
  app.use(express.json());

  var meta = new current.Meta(hm.models, connection);
  var Exhibition = meta.model('Exhibition');
  var News = meta.model('News');
  var Artist = meta.model('Artist');

  app.get('/', function (req, res) {
    Exhibition.find({state: PUBLISHED}, null, {sort: 'date'}, function (err, exhibits) {
      News.find({state: PUBLISHED}, function (err, news) {
        res.render('index', {exhibits: exhibits, news: news});
      });
    });
  });
  app.get('/artists', function (req, res) {
    Artist.find({state: PUBLISHED}, null, {sort: 'last_name'}, function (err, artists) {
      res.render('artists', {artists: artists});
    });
  });
  app.get('/artist/:id', function (req, res) {
    Artist.findOne({_id: req.params.id, state: PUBLISHED}, function (err, artist) {
      res.render('artist', {artist: artist});
    });
  });
  return app;
}




