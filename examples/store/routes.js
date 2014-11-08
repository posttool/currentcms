var _ = require('lodash');
var config = require('./config');
var guard = require('./auth/guard');
var utils = require('../../currentcms/lib/utils');

module.exports = function (app, cms) {

  var CustomerAddress = cms.meta.model('CustomerAddress');

  app.get('/', function (req, res) {
    if (req.user) {
      X.find({user: req.user}, null, {sort: {created: -1}}).populate('services').exec(function (err, events) {
        res.render('index.ejs', {events: events});
      });
    } else
      res.render('index.ejs', {events: null});
  });

  // add address preset (+list, update, delete)
  app.get('/address/list', guard.isLoggedIn, function (req, res, next) {
    CustomerAddress.find({user: req.user}, null, {sort: 'name'}).exec(function (err, addresses) {
      if (err) return next(err);
      res.json(addresses);
    });
  });

  app.post('/address/add', guard.isLoggedIn, function (req, res, next) {
    new CustomerAddress({
      user: req.user,
      name: req.body.name,
      address: req.body.address
    }).save(function (err, customerAddress) {
        if (err) return next(err);
        res.json(customerAddress)
      });
  });

  app.post('/address/update/:id', guard.isLoggedIn, function (req, res, next) {
    CustomerAddress.findOne({user: req.user, _id: req.params.id}).exec(function (err, customerAddress) {
      if (err) return next(err);
      if (!customerAddress) return next(new Error('no such address'));
      if (req.body.name)
        customerAddress.name = req.body.name;
      if (req.body.address)
        customerAddress.address = req.body.address;
      customerAddress.save(function (err, ca2) {
        if (err) return next(err);
        res.json(ca2);
      });
    });
  });

  app.post('/address/remove/:id', guard.isLoggedIn, function (req, res, next) {
    CustomerAddress.findOneAndRemove({user: req.user, _id: req.params.id}).exec(function (err, q) {
      if (err) return next(err);
      res.json(q);
    });
  });



};



