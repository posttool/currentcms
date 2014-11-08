var express = require('express');
var util = require('../modules/postera/util');


// serve express app
exports = module.exports = function(config, meta) {
  var app = express();
  app.set('view engine', 'ejs');
  app.set('views',__dirname + '/views');
  app.use(express.static(__dirname + '/public'));
  //app.use(favicon(__dirname + '/public/favicon.ico'));
  app.use(express.urlencoded());
  app.use(express.json());
  app.use(express.compress());

  var Page = meta.model('Page');
  var News = meta.model('News');

  app.get('/favicon.ico', function(req, res, next){
    res.status(404).send('Not found');
  });

  app.get('/page', function (req, res, next) {
    util.getSiteMapData(Page, function (err, site) {
      if (err) return next(err);
      res.json(site);
    });
  });

  app.get('/*', function (req, res, next) {
    util.getSiteMapData(Page, function (err, site) {
      if (err) return next(err);
      Page.findOne({url: req.path}).populate("resources").exec(function (err, page) { //state: PUBLISHED
        if (!err && !page) return next(new Error("No such page " + req.path));
        if (err) return next(err);
        News.find({}, function (err, news) {
          if (err) return next(err);
          var next_page = util.getNextNode(util.findById(site, page.id));
          res.render('index', {site: site, news: news, page: page, resource_basepath: util.get_res_bp(config), next_page: next_page});
        });
      });
    });
  });

  return app;



}
