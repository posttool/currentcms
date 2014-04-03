var mongoose = require('mongoose');
var models = require('./models');
var utils = require('./utils');


exports = module.exports = Meta;


function Meta(info, connection)
{
  this.info = info;
  this.connection = connection;
  this.schemas = {};
  this.Resource = null;
  this.Log = null;
  this.User = null;
  this._init();
}

Meta.prototype._init = function () {
  for (var p in this.info) {
    var info = this.info[p];
    var schema_data = info.schema;
    utils.validate_meta(p, schema_data, info.browse, info.form);
    var schema = this.schemas[p] = new mongoose.Schema(schema_data);
    if (info.meta.workflow)
      utils.add_fields_and_methods(schema, p);
    this.connection.model(p, schema);
    if (!info.browse)
    {
      info.browse = utils.create_browse_info(this.info, p);
      console.log('Added generated browse for '+p);
      console.log(info.browse);
    }
    if (!info.form)
    {
      info.form = utils.create_form_info(this.info, p);
      console.log('Added generated form for '+p);
      console.log(info.form);
    }
  }
  this.Resource = this.model('Resource');
  this.User = this.model('User');
  this.Log = this.connection.model('Log', models.LogSchema);
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

Meta.prototype.info = function(type)
{
  if (!this.info[type])
    throw new Error('no '+type);
  return utils.get_schema_info(this.schema(type));
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
  var refs = utils.get_references(meta.schema(type));
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
    var refs = utils.get_references(self.schema(p));
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

