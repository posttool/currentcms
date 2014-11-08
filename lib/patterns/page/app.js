var express = require('express');
var mongoose = require('mongoose');

var workflow = require('./workflow'),
    PUBLISHED = workflow.PUBLISHED,
    util = require('./util');

// serve express app
exports = module.exports = function(dirname, config, meta) {

  var app = express();
  app.set('view engine', 'ejs');
  app.set('views', dirname + '/views');
  app.use(express.static(dirname + '/public'));
  //app.use(favicon(__dirname + '/public/favicon.ico'));
  app.use(express.urlencoded());
  app.use(express.json());

  var Page = meta.model('Page');
  var News = meta.model('News');

  // endpoints

  app.get('/', function (req, res, next) {
    util.getSiteMapData(Page, function (err, site) {
      if (err) return next(err);
      var resources = util.getResources(site);
      News.find({}, function (err, news) {
        if (err) return next(err);
        res.render('index', {site: site, news: news, images: resources, next_page: site.pages[0].pages[0], resource_basepath: util.get_res_bp(config)});
      });
    });
  });

  app.get('/*', function (req, res, next) {
    util.getSiteMapData(Page, function (err, site) {
      if (err) return next(err);
      Page.findOne({url: req.path}).populate("resources").exec(function (err, page) { //state: PUBLISHED
        if (err) return next(err);
        if (!page) return next(new Error('no such page'));
        page = util.findById(site, page.id);
        var next_page = util.getNextNode(page);
        res.render('page', {page: page, site: site, next_page: next_page, resource_basepath: get_res_bp()});
      });
    });
  });

  return app;

}
