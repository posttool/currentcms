var form_auto_save = true;


function form_form(app, type, id) {
  var self = this;
  self.app = app;
  self.type = type;
  self.toString = function(){ return type; };

  var _meta = null;
  var _modules = null;
  var _related = null;
  var _id = id;
  var _created = null;
  var _modified = null;
  var _state = null;
  var _idx = {};
  var _dirty = false;
  var _logs = [];

  form_make_listener(self);

  var $el = $$('form');
  self.$el = function () {
    return $el;
  };

  var $controls = $$('form-controls');
  self.$controls = function () {
    update_controls();
    return $controls;
  };

  var $info = $$('form-info');
  self.$info = function(){
    update_info();
    return $info;
  };

  var $form = $$('form', {parent: $el});

  function update_form() {
    $form.empty();
    var $t = $form;
    var s = [];
    for (var i = 0; i < _meta.length; i++) {
      var d = _meta[i];
      if (d.begin) {
        s.push($t);
        var $x = $("<div></div>");
        if (d.options && d.options.className)
          $x.addClass(d.options.className);
        if ($t.data('float'))
          $x.css({'float':'left'});
        if (d.begin == 'row')
          $x.data('float',true);
        $t.append($x);
        $t = $x;
      }
      else if (d.end) {
        $t = s.pop();
      }
      else {
       var f = create_field(d);
        var $fel = f.$el();
        if ($t.data('float'))
          $fel.css({'float':'left'});
        $t.append($fel);
        _idx[d.name] = f;
      }
    }
    $t.append("<div style='clear:both;'></div>");
  }

  function create_field(d) {
    var f = new indicated_field(d);
    f.field.form = self;
    if (f.field.init)
      f.field.init();
    f.add_listener('change', function () {
      _dirty = true;
      self.$save.prop('disabled', false);
      self.emit('change');
      if (form_auto_save)
        save(4000);
    });
    // for reference fields
    f.add_listener('add', function (f) {
      if (d.options && d.options.type)
        self.emit('create', {type: d.options.type, field: f.field});
    });
    f.add_listener('browse', function (f) {
      if (d.options && d.options.type)
        self.emit('browse', {type: d.options.type, field: f.field})
    });
    f.add_listener('select', function(f, o){
      if (d.options && d.options.type)
        self.emit('select', {type: d.options.type, id: o._id, field: f.field});
    })
    return f;
  }

  function update_controls()
  {
    $controls.empty();
    //  var $title = $$('title', {el: 'span', parent: $controls}).text(type);
    //    var $cancel = $$('btn btn-primary', {el: 'button', parent: $controls}).text('CLOSE');
    //    $cancel.click(function(){
    //      self.emit('close', self.data);
    //    });
    self.$save = $$('save', {el: 'button', parent: $controls}).text('SAVE');
    if (!_dirty)
      self.$save.prop('disabled', true);
    self.$time = $$('time', {el: 'span', parent: $controls});
    self.$save.click(function () {
      save(0);
    });
    if (_modified)
      self.$time.text(' Last modified ' + timeSince(new Date(_modified)) + '.');
    else
      self.$time.text(' New record.');
  }

  var save_delayed = -1;
  function save(delay) {

    function do_save() {
      if (!_dirty) return;
      console.log(Date.now(), "save", self.type);
      $.ajax({
        url: self.url(),
        data: { val: JSON.stringify(self.data) },
        method: 'post',
        success: function (o) {
          if (o.name && o.name.indexOf("Error") != -1)
            self.error(o);
          else {
            self.update(o);
            history.pushState(self.url(), self.toString(), self.url());
            self.emit('save', o);
          }
        },
        error: function (o) {
          console.error(o);
        }
      });
    }

    if (delay == 0)
      return do_save();
    if (save_delayed != -1)
      clearTimeout(save_delayed);
    save_delayed = setTimeout(function () {
      save_delayed = -1;
      do_save();
    }, delay);
  }
  self.save = save;

  Object.defineProperty(self, "data", {
    get: function () {
      var d = {_id: _id, created: _created, modified: _modified, state: _state};
      for (var p in _idx)
        d[p] = _idx[p].data;
      return d;
    },
    set: function (n) {
      if (n == null)
        return;
      _id = n._id;
      _created = n.created;
      _modified = n.modified;
      _state = n.state;
      for (var p in _idx) {
        if (_idx[p])
          _idx[p].data = get_deep_value(n, p); //n[p];
      }
      update_ui();
    }
  });

  Object.defineProperty(self, "state", {
    get: function () {
     return _state;
    }
  });

  Object.defineProperty(self, "related", {
    get: function () {
     return _related;
    },
    set: function (r) {
      _related = r;
    }
  });

  Object.defineProperty(self, "id", {
    get: function () {
     return _id;
    }
  });

  Object.defineProperty(self, "logs", {
    get: function () {
     return _logs;
    }
  });

  function update_ui()
  {
    update_controls();
    update_info();
  }


  function update_info() {
    $info.empty();

    if (_modules) {
      for (var i=0; i<_modules.length; i++) {
        var m = new form_modules[_modules[i].widget](self);
        //m.add_listener?
        $info.append(m.$el());
      }
    }

    if (_state)
    {
      var sm = new form_modules.state(self);
      $info.append(sm.$el());
      sm.add_listener('save', function () {
        $$ajax(self.app.base_url + sm.api + '/' + type + '/' + _id,
          JSON.stringify({state: sm.selected, reason: sm.text}), 'post').done(function (r) {
            _state = sm.selected;
            update_info();
            refresh_logs();
        });
      });
    }

    var rd = new form_modules.ref_delete(self);
    rd.add_listener('select', function () { self.emit('select'); });
    rd.add_listener('close', function () { self.emit('close'); });
    $info.append(rd.$el());

    var l = new form_modules.logs(self);
    $info.append(l.$el());
  }


  self.error = function (o) {
      self.$time.text(' ERROR - see fields for details');
    _idx[o.path].error = JSON.stringify(o);
  }

  self.update = function (o) {
    _dirty = false
    self.data = o;
    refresh_logs();
    self.$save.prop('disabled', true);
  }

  self.url = function()
  {
      var url = self.app.base_url;
      if (_id)
        url += '/update/' + type + '/' + _id;
      else
        url += '/create/' + type;
    return url;
  }

  self.refresh = function()
  {
    if (_dirty)
    {
      console.log('cant refresh yet... save record...');
      return;
    }
    var url = self.app.base_url + '/get/' + type;
    if (_id)
      url += '/' + _id;
    $$ajax(url).done(function (o) {
      _meta = o.form;
      _modules = o.modules;
      _related =  o.related;
      _idx = {};
      update_form();
      if (!_id)
        delete o.object._id;
      self.data = o.object;
      refresh_logs();
    });
  };

  function refresh_logs()
  {
    if (!_id)
      return;
    $$ajax(self.app.base_url + '/logs/'+type+'/'+_id).done(function(r){
      _logs = r;
      // TODO do this just for logs update_info();
    });
  }
}


function indicated_field(d)//, settings_callback)
{
  if (!form_fields[d.widget + "_field"])
    throw Error("no field for " + d.widget);

  var self = this;
  var name = d.name;
  var label = d.label ? d.label : d.name;
  var type = d.widget;
  var options = d.options;
  var $el = $$('control-group '+type+' '+label);
  var showLabel = true;
  var lastCols = null;
  var cols = null;

  self.$el = function () {
    return $el;
  }
  form_make_listener(self);

  var $label = $('<label></label>').addClass('control-label').attr('for', name);
  var field = new form_fields[type + "_field"](d.options);
  form_make_listener(field);
  field.bubble_listener(self);
  self.field = field;
  $el.append($label, field.$el());
  label_update_ui();

  var $controls = null;
  if (field.$cel) {
    $controls = $$('controls '+type);
    $controls.append(field.$cel());
    $el.append($controls);
  }

  Object.defineProperty(this, "data", {
    get: function () {
      return field.data;
    },
    set: function (n) {
      field.data = n;
    }
  });

  function columns_update_ui() {
    $el.removeClass(lastCols);
    lastCols = 'col-1-' + cols;
    $el.addClass(lastCols);
  }

  Object.defineProperty(this, "columns", {
    get: function () {
      return  cols;
    },
    set: function (n) {
      cols = n;
      columns_update_ui();
    }
  });

  function label_update_ui() {
    if (options && options.collapsable) {
      $label.empty();
      var $c = $("<span class='field_collapse'>x</span>");
      function tgl(v){
        if (v) {
          $c.empty().append("<i class='fa fa-chevron-down'></i>");
          field.$el().hide();
        }
        else {
          $c.empty().append("<i class='fa fa-chevron-up'></i>");
          field.$el().show();
        }
      }
      var v = options.collapsed != null ? options.collapsed : true;
      tgl(v);
      $c.click(function(){
        v = !v;
        tgl(v);
      });
      $label.append($c, "<span style='padding-left:5px;'>"+label+"</span>");
    } else {
      $label.text(label);
    }
    if (showLabel)
      $label.show();
    else
      $label.hide();
  }

  Object.defineProperty(this, "label", {
    get: function () {
      return  label;
    },
    set: function (n) {
      label = n;
      label_update_ui();
    }
  });

  Object.defineProperty(this, "field", {
    get: function () {
      return field;
    }
  });
  Object.defineProperty(this, "name", {
    get: function () {
      return name;
    }
  });
  Object.defineProperty(this, "error", {
    set: function (e) {
      field.$el().append('<span class="help-inline">' + e + '</span>');
      $el.addClass('error');
    }
  });

}



