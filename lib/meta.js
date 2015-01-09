var mongoose = require('mongoose');
var models = require('./models');
var utils = require('./utils');


exports.Meta = Meta;

function Meta(info, connection, autogenMeta)
{
  this.info = info;
  this.connection = connection;
  this.schemas = {};
  this._init(autogenMeta);
}

Meta.prototype._init = function (autogenMeta) {
  var self = this;
  for (var p in this.info) {
    (function (p) {
      var info = self.info[p];
      var schema_data = info.schema;
      //exports.validate_meta(p, schema_data, info.browse, info.form);
      var schema = self.schemas[p] = new mongoose.Schema(schema_data);
      if (info.methods)
        for (var methodname in info.methods) {
          schema.methods[methodname] = info.methods[methodname];
        }
      if (info.meta.workflow)
        exports.add_fields_and_methods(schema, p);
      if (info.preremove){
        console.log('adding pre remove to '+p);
        schema.pre('remove', function(next){ info.preremove(this,next)});
      }
      self.connection.model(p, schema);
      if (autogenMeta && !info.browse)
      {
        info.browse = exports.create_browse_info(self, p);
        console.log('Added generated browse for '+p);
        console.log(info.browse);
      }
      if (autogenMeta && !info.form)
      {
        info.form = exports.create_form_info(self, p);
        console.log('Added generated form for '+p);
        console.log(info.form);
      }
    })(p);
  }
  // shortcuts ...  must be added in module
  this.Resource = this.model('Resource');
  this.User = this.model('User');
  // added automatically ... no ui
  this.Log = this.connection.model('Log', models.LogSchema);
  this.Request = this.connection.model('Request', models.RequestSchema);
};

Meta.prototype.browse = function(type, sub_type)
{
  if (!this.info[type])
    throw new Error('no '+type);
  if (!sub_type)
    return this.info[type].browse;
  var browse = this.info[type]['browse_'+sub_type];
  if (browse)
    return browse;
  else
    return this.info[type].browse;
};

Meta.prototype.form = function(type, sub_type)
{
  if (!this.info[type])
    throw new Error('no '+type);
  if (!sub_type)
    return this.info[type].form;
  var form = this.info[type]['form_'+sub_type];
  if (form)
    return form;
  else
    return this.info[type].form;
};

Meta.prototype.formModules = function(type)
{
  if (!this.info[type])
    throw new Error('no '+type);
  return this.info[type].formModules || [];
};

Meta.prototype.jsIncludes = function()
{
  var includes = [];
  for (var p in this.info) {
    if (this.info[p].includes) {
      for (var i=0; i<this.info[p].includes.length; i++)
        includes.push(this.info[p].includes[i]);
    }
  }
  return includes;
};

Meta.prototype.schema = function(type)
{
  if (!this.schemas[type])
    throw new Error('no '+type);
  return this.schemas[type];
};

Meta.prototype.model = function(type)
{
  if (!this.info[type])
    throw new Error('no '+type);
  return this.connection.model(type);
};

Meta.prototype.schema_info = function(type)
{
  if (!this.info[type])
    throw new Error('no '+type);
  return exports.get_schema_info(this.schema(type));
}

Meta.prototype.meta = function(type)
{
  if (!type)
    return this.info;
  if (!this.info[type])
    throw new Error('no '+type);
  else
    return this.info[type].meta;
}




Meta.prototype.expand = function (type, id, next) {
  var self = this;
  var q = self.model(type).findOne({_id: id});
  q.exec(function (err, m) {
    populate_deep(self, type, m, function () {
      next(err, m);
    });
  });
};


populate_deep = function (meta, type, instance, next, seen) {
  if (!instance) {
    next();
    return;
  }
  if (!seen)
    seen = {};
  if (seen[instance._id]) {
    next();
    return;
  }
  seen[instance._id] = true;
  var refs = exports.get_references(meta.schema(type));
  if (!refs) {
    next();
    return;
  }
  var opts = [];
  for (var i = 0; i < refs.length; i++)
    if (refs[i].ref != 'User')
      opts.push({path: refs[i].name, model: refs[i].ref});
  meta.model(type).populate(instance, opts, function (err, o) {
    utils.forEach(refs, function (r, n) {
      if (r.is_array)
        utils.forEach(o[r.name], function (v, nn) {
          populate_deep(meta, r.ref, v, nn, seen);
        }, n);
      else
        populate_deep(meta, r.ref, o[r.name], n, seen);
    }, next);
  });
};


Meta.prototype.related = function (type, id, next) {
  var self = this;
  var related_refs = [];
  for (var p in self.meta()) {
    var refs = exports.get_references(self.schema(p));
    for (var i = 0; i < refs.length; i++) {
      if (refs[i].ref == type) {
        related_refs.push({type: p, field: refs[i]});
      }
    }
  }
  var related_records = { _count: 0 };
  if (related_refs) {
    utils.forEach(related_refs, function (ref, n) {
      var c = {};
      c[ref.field.name] = {$in: [id]}
      var q = self.model(ref.type).find(c);
      q.exec(function (err, qr) {
        related_records._count += qr.length;
        related_records[ref.type] = {field: ref.field, results: qr, query: q};
        n();
      });
    }, function () {
      next(related_records);
    });
  }
  else
    next(related_records);
};






// utils


// meta utils

var mongoose = require('mongoose');

// TODO plugin
// http://mongoosejs.com/docs/plugins
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
  'state': String
};
exports.add_fields_and_methods = function (schema, name) {
  schema.add(extra_fields);
//  schema.virtual('url').get(function () {
//    return name.toLowerCase() + '/' + this._id;
//  });
//  schema.virtual('type').get(function () {
//    return name.toLowerCase() + '/' + this.uuid;
//  });
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
    case Boolean:
      stype = "Boolean";
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
  if (mtype.options.enum)
    d.enum = mtype.options.enum;
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
      if (si[p].ref == 'Resource')
        s.push({name: si[p].name, widget: "upload", options: {type: si[p].ref, array: si[p].is_array}});
      else
        s.push({name: si[p].name, widget: "choose_create", options: {type: si[p].ref, array: si[p].is_array}});
    else if (si[p].type == 'Date')
      s.push({name: si[p].name, widget: "datetime"});
    else if (si[p].type == 'Boolean')
      s.push({name: si[p].name, widget: "boolean"});
    else if (si[p].enum)
      s.push({name: si[p].name, widget: "select", options: {options: si[p].enum}});
    else
      s.push({name: si[p].name, widget: "input"});
  }
  return s;
}





