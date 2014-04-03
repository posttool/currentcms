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
      if (k < list.length)
        ff();
      else
        complete();
    });
    i++;
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





// meta utils

var mongoose = require('mongoose');


/**
  manages schema
   - adds fields: creator, created, modified, state
   - adds getters: url, type
   - adds pre save to set times
 */
extra_fields = {
  'creator': {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  'created': Date,
  'modified': Date,
  'state': Number
};
exports.add_fields_and_methods = function (schema, name) {
  schema.add(extra_fields);
  schema.virtual('url').get(function () {
    return name.toLowerCase() + '/' + this._id;
  });
  schema.virtual('type').get(function () {
    return name.toLowerCase() + '/' + this.uuid;
  });
  schema.pre('save', function (next) {
    this.modified = new Date();
    if (!this.created)
      this.created = new Date();
    next();
  });
}


exports.validate_meta = function (p, schema, browse, form) {
  if (browse)
    for (var i = 0; i < browse.length; i++)
      if (browse[i].name && !schema[browse[i].name] && !extra_fields[browse[i].name]) {
        //console.log(schema);
        console.log(p + '.browse path inconsistency: ' + browse[i].name);
      }
  if (form)
    for (var i = 0; i < form.length; i++)
      if (form[i].name && !schema[form[i].name] && !extra_fields[form[i].name]) {
        //console.log(schema);
        console.log(p + '.form path inconsistency: ' + form[i].name);
      }
}





// model meta helpers

exports.get_schema_info = function(schema)
{
  var d = {};
  schema.eachPath(function (path, mtype) {
    if (path.charAt(0)!='_')
      d[path] = get_path_info(path, mtype);
  });
  return d;
}

/**
 * returns a simple summary of the mongoose schema info.
 * the "Reference" type is used throughout in a standardized way. TODO handle relationships between references.
 *
 * @param path the mongoose schema path
 * @param mtype the mongoose type (provided by ```schema.forEach(function(path,type)```)
 * @returns {{name: *, type: *, is_array: boolean}}
 */
get_path_info = function (path, mtype) {
  var is_array = false;
  var ftype = null;
  var stype = null;
  var ref = null;
  if (mtype.options.type) {
    is_array = Array.isArray(mtype.options.type);
    ftype = is_array ? mtype.options.type[0] : mtype.options;
  }
  if (ftype != null && ftype.ref) {
    ref = ftype.ref;
  }
  switch (ftype.type) {
    case String:
      stype = "String";
      break;
    case Number:
      stype = "Number";
      break;
    case Date:
      stype = "Date";
      break;
    case mongoose.Schema.Types.ObjectId:
      if (ref)
        stype = "Reference";
      else
        stype = "Id";
      break;
    default:
      stype = ftype.type;
      break;
  }
  var d = {
    name: path,
    type: stype,
    is_array: is_array
  };
  if (ref != null) {
    d.type = 'Reference';
    d.ref = ref;
  }
  return d;
};


/**
 *
 * @param schema
 * @param type - our normalized type string
 * @returns []
 */
exports.get_by_type = function(schema, type) {
  var d = [];
  schema.eachPath(function (path, mtype) {
    var info = get_path_info(path, mtype);
    if (info.type == type)
      d.push(info);
  });
  return d;
};


exports.get_references = function(schema) {
  return exports.get_by_type(schema, 'Reference');
};


exports.get_names = function (field_info) {
  if (!field_info)
    return [];
  else return field_info.map(function (elem) {
    return elem.name;
  });
};






/// default form/browser meta data

exports.create_browse_info = function(meta, type)
{
  var si = exports.get_schema_info(meta.schema(type));
  var s = [];
  for (var p in si)
  {
      s.push({name: si[p].name, cell: "char", filters: ["$regex", "="], order: "asc,desc,default"})
  }
  return s;
}



exports.create_form_info = function(meta, type)
{
  var si = exports.get_schema_info(meta.schema(type));
  var s = [];
  for (var p in si)
  {
    if (p == 'creator' || p == 'created' || p == 'modified' || p == 'state')
      continue;
    if (si[p].type == 'Reference')
      s.push({name: si[p].name, widget: "choose_create", options: {type: si[p].ref, array: si[p].is_array}});
    else
      s.push({name: si[p].name, widget: "input"});
  }
  return s;
}








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