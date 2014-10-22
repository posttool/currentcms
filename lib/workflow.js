exports.Workflow = Workflow;

function Workflow(info) {
  this.info = info;
  if (!this.info)
    return;
  this._init();
}

Workflow.prototype._init = function() {
  var states = [];
  for (var i=0; i<this.info.states.length; i++)
  {
    var code = this.info.states[i];
    var name = this.info[code] ? this.info[code].name : code;
    states.push({name: name, code: code});
  }
  this.states = states;
  var groups = [];
  for (var p in this.info.groups)
    groups.push(p);
  this.groups = groups;
}

Workflow.prototype.get_info = function(user) {
  if (!this.info)
    return null;
  var group = user.admin ? this.info.groups.admin : user.group;
  var ginfo = this.info.groups[group];
  return {states: this.states, transitions: ginfo.transitions, requests: ginfo.requests};
}

Workflow.prototype.can_update = function(user, type, from, to) {
  if (!this.info)
    return false;
  var group = user.admin ? this.info.groups.admin : user.group;
  var ginfo = this.info.groups[group];
  return can(ginfo.transitions, from, to);
}

Workflow.prototype.can_request = function(user, type, from, to) {
  if (!this.info)
    return false;
  var group = user.admin ? this.info.groups.admin : user.group;
  var ginfo = this.info.groups[group];
  return can(ginfo.requests, from, to);
}

function can(wlist, from, to){
    for (var i=0; i<wlist.length; i++)
    if (wlist[i].from == from)
      for (var j=0; j<wlist[i].to.length; j++)
        if (wlist[i].to[j] == to)
          return true;
  return false;
}