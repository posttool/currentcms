exports.Guard = Guard;

function Guard(permissions) {
  this.map = permissions ? permissions : {};
}


// browse

Guard.prototype.can_browse = function (user, type) {
  return can(this.map[user.group], type, 'can_browse');
}

Guard.prototype.browse_type = function (user, type) {
  var info = this.map[user.group];
  if (!info)
    return null;
  if (!info[type])
    return null;
  if (!info[type].browse)
    return null;
  return info[type].browse.subtype;
}

Guard.prototype.browse_conditions = function (user, type) {
  var info = this.map[user.group];
  if (!info)
    return null;
  if (!info[type])
    return null;
  if (!info[type].browse)
    return null;
  return info[type].browse.condition;
}

// form
Guard.prototype.can_edit = function (user, type) {
  return can(this.map[user.group], type, 'can_edit');
}

Guard.prototype.can_create = function (user, type) {
  return can(this.map[user.group], type, 'can_create');
}

Guard.prototype.can_delete = function (user, type) {
  return can(this.map[user.group], type, 'can_delete');
}

// form type for group...
Guard.prototype.form_type = function (user, type) {
  var info = this.map[user.group];
  if (!info)
    return null;
  if (!info[type])
    return null;
  if (!info[type].form)
    return null;
  return info[type].form.subtype;
}

Guard.prototype.form_permission = function (user, type) {
  var info = this.map[user.group];
  if (!info)
    return null;
  if (!info[type])
    return null;
  if (!info[type].form)
    return null;
  return info[type].form.permission;
}


// prepares meta info for a user about what they can browse and not browse
Guard.prototype.get_models = function(user, meta) {
  var info = this.map[user.group];
  if (user.admin || info.admin)
    return this.get_admin_models(meta);

  var models = [];
  for (var type in info) {
    models.push({
      info: info[type],
      schema: meta.schema_info(type),
      meta: meta.meta(type),
      type: type
    });
  }
  return models;
}

Guard.prototype.get_admin_models = function(meta){
  var models = [];
  for (var type in meta.info){
    models.push({
      info: {admin: true},
      schema: meta.schema_info(type),
      meta: meta.meta(type),
      type: type
    });
  }
  return models;
}


// util
function can(info, type, prop)
{
  if (!info)
    return false;
  if (info.admin)
    return true;
  if (!info[type])
    return false;
  if (info[type].admin)
    return true;
  return info[type][prop];
}
