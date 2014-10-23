var express = require('express');
var nodemailer = require("nodemailer");

var models = require('./models');
var utils = require('./utils');


exports.Auth = Auth;


function Auth(meta, onLogin) {
  this.meta = meta;
  this.onLogin = onLogin;
}



Auth.prototype.get_user = function(id, complete) {
  if (id)
    this.meta.User.findOne({_id: id}, complete);
  else
    complete(null, new this.meta.User());
}


Auth.prototype.login_get = function (req, res) {
  res.render('auth/login', {});
};


Auth.prototype.login_post = function (req, res) {
  var self = this;
  var noway = function () {
    req.session.message = 'no way';
    res.redirect(req.query.next || self.onLogin);
  }
  var q = {email: req.body.email};
  self.meta.User.findOne(q, function (err, user) {
    if (!user)
      noway();
    else {
      utils.hash(req.body.password, user.salt, function (err, hash) {
        if (err) {
          noway();
          return;
        }
        if (hash != user.hash){
          noway();
          return;
        }
        req.session.message = 'Welcome!';
        req.session.user = user;
        res.redirect(req.query.next ?  req.query.next : self.onLogin);
      })
    }
  });
};


//Auth.prototype.register_get = function (req, res) {
//    res.render('auth/register');
//  };
//
//Auth.prototype.register_post = function (req, res) {
//    var q = {email: req.body.email};
//    User.findOne(q, function (err, user) {
//      if (user) {
//        req.session.message = 'User with email already exists';
//        if (!user.verified)
//          exports.send_mail(user);
//        res.redirect('.');
//        return;
//      }
//      exports.create_user({name: req.body.username, email: req.body.email, password: req.body.password}, function(err, user){
//          req.session.message = err ? 'uhoh ' + err : 'you registered!';
//          req.session.user = user;
//          if (!user.verified)
//            exports.send_mail(user);
//          res.redirect('.');
//      });
//    });
//};





Auth.prototype.send_validation_email = function (req, res) {
  console.log('/validate?h='+req.session.user.hash);
};


Auth.prototype.validate_email = function (req, res) {
  var q = {hash: req.params.h};
  this.meta.User.findOne(q, function (err, user) {
    if (!user) {
      req.session.message = 'nope';
      res.redirect('.');
      return;
    }
    user.verified = true;
    user.save(function (err, user) {
      req.session.message = err ? 'uhoh ' + err : 'you registered!';
      req.session.user = user;
      res.redirect('.');
    });
  });
};


Auth.prototype.logout = function (req, res) {
  req.session.destroy(function () {
    res.redirect('/login');
  });
};



// form: create/update
Auth.prototype.profile_get = function (req, res) {
  var UserInfo = models.UserInfo()
  res.render('auth/profile', {
    title: 'Profile',
    id: req.id ? req.id : null,
    form: UserInfo.form});
};


// form (json): get the object, related objects as well as form meta info
Auth.prototype.profile_get_json = function (req, res) {
  var user = req.session.user;
  var UserInfo = models.UserInfo()
  res.json({
    title: (user ? 'Editing' : 'Creating') + ' User',
    object: user,
    form: UserInfo.form});
};


// form (json): save
Auth.prototype.profile_post = function (req, res) {
  var data = JSON.parse(req.body.val);
  var user = req.session.user;
  for (var p in data)
    user[p] = data[p];
  user.save(function (err, s) {
    res.json(user);
  });
};





/// perms

exports.has_user = function (req, res, next) {
  if (req.session.user && req.session.user.active) {
    next();
  } else {
    req.session.message = 'Access denied!';
    res.redirect('/login?next=' + encodeURIComponent(req.url));
  }
}

exports.is_admin = function (req, res, next) {
  if (req.session.user.admin) {
    next();
  } else {
    req.session.message = 'Access denied!';
    res.redirect('/login?next=' + encodeURIComponent(req.url));
  }
}
//
//exports.is_user = function(req, res, next)
//{
//    if (req.session.user == req.user) {
//        next();
//    } else {
//        req.session.error = 'Access denied!';
//        res.redirect('/login');
//    }
//}






/////// mailin



//var smtpTransport = nodemailer.createTransport("SMTP",{
//  service: "Gmail",
//  auth: {
//      user: "",
//      pass: ""
//  }
//});


//exports.send_mail = function (user, subject, text, html) {
//  var mailOptions = {
//    from: "CMS <currently13@gmail.com>",
//    to: user.email,
//    subject: 'validate',
//    text: 'did you just reg? click /validate?h={user.hash} to complete',
//    html: 'did you just reg? click /validate?h={user.hash} to complete'
//  }
//
//  // send mail with defined transport object
//  smtpTransport.sendMail(mailOptions, function (error, response) {
//    if (error) {
//      console.log(error);
//    } else {
//      console.log("Message sent: " + response.message);
//    }
//    // if you don't want to use this transport object anymore, uncomment following line
//    //smtpTransport.close(); // shut down the connection pool, no more messages
//  });
//};



//var Mailgun = require('mailgun').Mailgun;
//
//var mg = new Mailgun('some-api-key');
//mg.sendText('example@example.com', ['Recipient 1 <rec1@example.com>', 'rec2@example.com'],
//  'This is the subject',
//  'This is the text',
//  'noreply@example.com', {},
//  function(err) {
//    if (err) console.log('Oh noes: ' + err);
//    else     console.log('Success');
//});
