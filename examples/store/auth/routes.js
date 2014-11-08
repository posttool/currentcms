var express = require('express');
var guard = require('./guard');

module.exports = function (passport) {

  var server = express.Router();

// =============================================================================
// PROFILE

  server.get('/profile', guard.isLoggedIn, function (req, res) {
    res.render('profile.ejs', {
      user: req.user
    });
  });

// =============================================================================
// LOGOUT

  server.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

// =============================================================================
// AUTHENTICATE

  // local   --------------------------------

  server.get('/login', function (req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  server.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  server.get('/signup', function (req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  server.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
  }));

  // facebook -------------------------------

  server.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

  server.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      successRedirect: '/profile',
      failureRedirect: '/'
    }));

  // twitter --------------------------------

  server.get('/auth/twitter', passport.authenticate('twitter', { scope: 'email' }));

  server.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
      successRedirect: '/profile',
      failureRedirect: '/'
    }));


  // google ---------------------------------

  server.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'] })); //accessType: 'offline', approvalPrompt: 'force',

  server.get('/auth/google/callback',
    passport.authenticate('google', {
      successRedirect: '/profile',
      failureRedirect: '/'
    }));

// =============================================================================
// AUTHORIZE / LINK

  // local   --------------------------------
  server.get('/connect/local', function (req, res) {
    res.render('connect-local.ejs', { message: req.flash('loginMessage') });
  });

  server.post('/connect/local', passport.authenticate('local-signup', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/connect/local', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // facebook -------------------------------

  server.get('/connect/facebook', passport.authorize('facebook', { scope: 'email' }));

  server.get('/connect/facebook/callback',
    passport.authorize('facebook', {
      successRedirect: '/profile',
      failureRedirect: '/'
    }));

  // twitter --------------------------------

  server.get('/connect/twitter', passport.authorize('twitter', { scope: 'email' }));

  server.get('/connect/twitter/callback',
    passport.authorize('twitter', {
      successRedirect: '/profile',
      failureRedirect: '/'
    }));


  // google ---------------------------------

  server.get('/connect/google', passport.authorize('google', {  scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'] })); //accessType: 'offline', approvalPrompt: 'force',

  server.get('/connect/google/callback',
    passport.authorize('google', {
      successRedirect: '/profile',
      failureRedirect: '/'
    }));

// =============================================================================
// UNLINK ACCOUNTS

  // local -----------------------------------
  server.get('/unlink/local', function (req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function (err) {
      res.redirect('/profile');
    });
  });

  // facebook -------------------------------
  server.get('/unlink/facebook', function (req, res) {
    var user = req.user;
    user.facebook.token = undefined;
    user.save(function (err) {
      res.redirect('/profile');
    });
  });

  // twitter --------------------------------
  server.get('/unlink/twitter', function (req, res) {
    var user = req.user;
    user.twitter.token = undefined;
    user.save(function (err) {
      res.redirect('/profile');
    });
  });

  // google ---------------------------------
  server.get('/unlink/google', function (req, res) {
    var user = req.user;
    user.google.token = undefined;
    user.save(function (err) {
      res.redirect('/profile');
    });
  });

  return server;
};

