exports.forEach = function(list, target, complete, concurrent)
{
  if (!list || list.length == 0)
  {
    complete();
    return;
  }
  var c = concurrent ? concurrent : 1;
  var i = 0;
  var k = 0;
  var ff = function(){
    for (var j=0; j<c && i+j<list.length; j++) f();
  }
  var f = function()
  {
    var item = list[i];
    target(item, function(){
      k++;
      i++;
      if (k < list.length)
        ff();
      else
        complete();
    });
  }
  ff();
}


//logging

var winston = require('winston');
require('winston-mongodb').MongoDB;

exports.get_logger = function(name)
{
  return new winston.Logger({
    transports: [
      new winston.transports.Console({colorize: true}),
      new winston.transports.MongoDB({host: 'localhost', db: 'logs', collection: name})
    ]
  });
}





// id conversion

exports.just_ids = function (a) {
  var r = [];
  for (var i = 0; i < a.length; i++)
    if (a[i])
      r.push(exports.just_id(a[i]));
  return r;
}


exports.just_id = function (a) {
  if (a && a._id)
    return String(a._id);
  else
    return a;
}

// compare arrays
exports.compareArrays = function (a, b) {
  if (!a && !b)
    return true;
  if (!a || !b)
    return false;
  if (a.length != b.length)
    return false;
  for (var i = 0; i < a.length; i++)
    if (a[i] != b[i])
      return false;
  return true;
}


// given form meta info & related schema info & some new data, compare new data to the original and return 'diffs'.
var jsdiff = require('diff');
exports.get_diffs = function(form, schema_info, data, original){
  var info = { diffs: {} };
  for (var i = 0; i < form.length; i++) {
    var f = form[i].name;
    if (!f)
      continue;
    var field_info = schema_info[f];
    if (!field_info)
      continue;
    var field_val = original[f];
    var match = false;
    if (field_info.type == 'Reference') {
      field_val = field_info.is_array ? exports.just_ids(field_val) : exports.just_id(field_val);
      match = exports.compareArrays(field_val, data[f])
    }
    else
      match = (data[f] == field_val) || (data[f] == '' && field_val == null);
    if (!match) {
      if (f != 'modified')//or other auto date fields...!
        info.diffs[f] = jsdiff.diffChars(field_val, data[f]);
    }
  }
  return info;
}






// process ui description of filter into mongo ready
exports.process_browse_filter = function (o) {
  var c = {};
  for (var p in o) {
    var op = o[p];
    if (op.condition.charAt(0) == '$') {
      c[p] = {};
      c[p][op.condition] = op.value;
      if (op.condition == '$regex') {
        c[p]['$options'] = 'i';
      }
    }
    else if (op.condition == '=') {
      c[p] = op.value;
    }
  }
  return c;
};






// auth stuff

exports.save_user = function(user, options, complete)
{
  exports.set_password(user, options.password, function(){
    delete options.password;
    for (var p in options)
      user[p] = options[p];
    user.save(function (err, user) {
      complete(err, user);
    });
  });
}


exports.set_password = function(user, password, complete)
{
  exports.hash(password, function (err, salt, hash) {
    if (err) throw err;
    user.salt = salt;
    user.hash = hash;
    complete();
  });
}






// https://github.com/visionmedia/node-pwd
var crypto = require('crypto');

var crypto_len = 128;
var crypto_iterations = 12000;

/**
 * Hashes a password with optional `salt`, otherwise
 * generate a salt for `pass` and invoke `fn(err, salt, hash)`.
 *
 * @param {String} password to hash
 * @param {String} optional salt
 * @param {Function} callback
 * @api public
 */

exports.hash = function(pwd, salt, fn) {
  try {
    if (3 == arguments.length) {
        crypto.pbkdf2(pwd, salt, crypto_iterations, crypto_len, function(err, hash) {
            fn(err, hash.toString('base64'));
        });
    } else {
        fn = salt;
        crypto.randomBytes(crypto_len, function(err, salt) {
            if (err) return fn(err);
            salt = salt.toString('base64');
            crypto.pbkdf2(pwd, salt, crypto_iterations, crypto_len, function(err, hash) {
                if (err) return fn(err);
                fn(null, salt, hash.toString('base64'));
            });
        });
    }
  } catch (e) {
    fn(e);
  }
};




//
exports.expand_functions = function(ctx, list)
{
  var ff = [];
  for (var i=0; i<list.length; i++)
  {
    var o =  list[i];
    var fo = {};
    ff.push(fo);
    for (var p in o){
      if (typeof(o[p]) == 'function')
        fo[p] = o[p](ctx);
      else
        fo[p] = o[p];
    }
  }
  return ff;
}