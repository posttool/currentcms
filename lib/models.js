var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId;
var utils = require('./utils');


exports.ResourceInfo = function(){
  return {
    meta: {
      plural: 'Resources',
      workflow: true,
      dashboard: true
    },
    schema: {
      name: String,
      path: String,
      size: Number,
      mime: String,
      meta: mongoose.Schema.Types.Mixed,
      children: [{
        path: String,
        size: Number,
        mime: String,
        meta: mongoose.Schema.Types.Mixed
      }]
    },
    browse: [
      {name: "path", cell: "char", filters: ["$regex", "="], order: "asc,desc"},
      {name: "size", cell: "int", filters: ["$gt", "$lt", "$gte", "$lte"], order: "asc,desc"},
      {name: "mime", cell: "char", filters: ["$regex", "="], order: "asc,desc"},
    ],
    form: [
      {name: "path", widget: "resource_path"},
      {name: "size", widget: "number"},
      {name: "mime", widget: "input"},
      {name: "meta", widget: "json"},
      {name: "children", widget: "choose_create", options: {type: "Resource", array: true, readonly: true}}
    ]
  }
}

// user

exports.UserInfo = function(){
  return {
    meta: {
      plural: 'Users',
      workflow: true,
      dashboard: true,
      name: "<%= name %>",
      references: 'manual'
    },
    schema: {
      name: {type: String, required: true, trim: true},
      email: {type: String, required: true, trim: true, lowercase: true, unique: true},
      email_verified: {type:Boolean, default: false},
      image: {type: ObjectId, ref: 'Resource'},
      hash: {type: String},
      salt: {type: String},
      created: {type: Date, default: Date.now},
      last_login: {type: Date, default: Date.now},
      group: {type:String},
      admin: {type:Boolean, default: false},
      active: {type:Boolean, default: false}
    },
    browse: [
      {name: "name", cell: "char", filters: ["$regex", "="], order: "asc,desc"},
      {name: "email", cell: "char", filters: ["$regex", "="], order: "asc,desc"},
      {name: "group", cell: "bool", filters: ["="], order: "asc,desc"},
      {name: "admin", cell: "bool", filters: ["="], order: "asc,desc"},
      {name: "email_verified", cell: "bool", filters: ["="], order: "asc,desc"},
      {name: "active", cell: "bool", filters: ["="], order: "asc,desc"},
    ],
    form_profile: [
      {name: "name", widget: "input"},
      {name: "email", widget: "email"},
      {name: "image", widget: "upload", options: {type: "Resource", array: false}},
      {name: "password", widget: "password"}
    ],
    form: [
      {name: "name", widget: "input"},
      {name: "email", widget: "email"},
      {name: "image", widget: "upload", options: {type: "Resource", array: false}},
      {name: "password", widget: "password"},
      {name: "group", widget: "select", options: {options: ['editor','contributor']}},
      {name: "active", widget: "boolean"},
      {name: "admin", widget: "boolean"},
    ],
    presave: function(user, new_values, next)
    {
      if (new_values.password)
        utils.hash(new_values.password, function (err, salt, hash) {
          if (err) throw err;
          new_values.salt = salt;
          new_values.hash = hash;
          delete new_values.password;
          next();
        });
      else
        next();
    }
  }
}

exports.UserSchema = new mongoose.Schema(exports.UserInfo().schema);


// log
exports.LogSchema = new mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  action: String,
  type: String,
  id: mongoose.Schema.Types.ObjectId,
  info: mongoose.Schema.Types.Mixed,
  time: { type: Date, default: Date.now }
})

// group
// transition
// assignment
// msg
