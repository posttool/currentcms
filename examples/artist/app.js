var path = require('path');
var express = require('express');
var mongoose = require('mongoose');
var _ = require('lodash');
var postera = require('../modules/postera/util');
var workflow = require('./workflow'),
    PUBLISHED = workflow.PUBLISHED,
    util = require('./util');


exports = module.exports = function(config, meta) {
  var app = express();
  app.set('view engine', 'ejs');
  app.set('views',__dirname + '/views');
  app.use(express.static(__dirname + '/public'));
  //app.use(favicon(__dirname + '/public/favicon.ico'));
  app.use(express.urlencoded());
  app.use(express.json());

  var Page = meta.model('Page');
  var News = meta.model('News');
  var Resource = meta.model('Resource');

  var getResources = function (page, resources) {
    if (resources == null)
      resources = [];
    if (page.resources) {
      for (var i = 0; i < page.resources.length; i++) {
        var r = page.resources[i];
        if (r.for_home_page) {
          r.source = {page: page._id, url: page.url, index: i};
          resources.push(r);
        }
      }
    }
    if (page.pages) {
      for (var i = 0; i < page.pages.length; i++) {
        getResources(page.pages[i], resources);
      }
    }
    return resources;
  }

  function get_res_bp(){
    return "http://res.cloudinary.com/" + config.cloudinaryConfig.cloud_name + "/image/upload";
  }

  function th_page_view(p) {
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      url: p.url,
      pages: p.pages,
      resources: _.map(p.resources, function (o) {
        var title = o.title;
        if (!title) {
          var fn = path.basename(o.path);
          var ex = path.extname(fn);
          title = fn.substring(0, fn.length - ex.length);
        }
        return {title: title, description: o.description,
          public_id: o.meta.public_id, url: o.meta.url,
          for_home_page: o.for_home_page, sizes_and_prices: o.sizes_and_prices,
          edition_number: o.edition_number, quantity: o.quantity, year: o.year }
      }),
      template: p.template
    };
  }

  // endpoints

  app.get('/favicon.ico', function(req, res, next){
    res.status(404).send('Not found');
  });

  app.get('/', function (req, res, next) {
    postera.getSiteMapData(Page, th_page_view, function (err, site) {
      if (err) return next(err);
      var resources = getResources(site.pages[0]);
      News.find({}, function (err, news) {
        if (err) return next(err);
        res.render('index', {site: site, news: news, images: resources, next_page: site.pages[0].pages[0], resource_basepath: get_res_bp()});
      });
    });
  });

  app.get('/*', function (req, res, next) {
    postera.getSiteMapData(Page, th_page_view, function (err, site) {
      if (err) return next(err);
      Page.findOne({url: req.path}).exec(function (err, page) { //state: PUBLISHED
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
