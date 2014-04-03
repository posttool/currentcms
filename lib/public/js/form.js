


function form_form(app, type, id) {
  var self = this;
  self.app = app;
  self.type = type;
  self.toString = function(){ return 'Edit '+type; }

  var _meta = null;
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
  }

  var $controls = $$('form-controls');
  self.$controls = function () {
    update_controls();
    return $controls;
  }

  var $info = $$('form-info');
  self.$info = function(){
    update_info();
    return $info;
  }

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
    f.add_listener('change', function () {
      _dirty = true;
      self.$save.prop('disabled', false);
      self.emit('change');
    });
    // for reference fields
    f.add_listener('add', function (f) {
      self.emit('create', {type: d.options.type, field: f.field});
    });
    f.add_listener('browse', function (f) {
      self.emit('browse', {type: d.options.type, field: f.field})
    });
    f.add_listener('select', function(f, o){
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
      })
    });
    if (_modified)
      self.$time.text(' Last modified ' + timeSince(new Date(_modified)) + '.');
    else
      self.$time.text(' New record.');
  }

  function update_info() {
    $info.empty();

    if (_state)
    {
      var selected = -1;
      var $last = $$();
      var $info_state = $$('state-panel', {parent: $info});
      $info_state.append('<h3>Status</h3>');
      var $state_is = $("<div class='state-change-choice'><i class='fa fa-check-circle-o'></i> "+get_state_name(_state)+"</b></div>");
      $state_is.click(function(){
        $last.removeClass('selected');
        $last.find('i').removeClass('fa-check-circle-o');
        $last.find('i').addClass('fa-circle-o');
        selected = -1;
        $last = $$();
        $state_change_ok_btn.prop('disabled', true);
      });
      $info_state.append($state_is);
      var $state_change_btn = $("<button>CHANGE STATUS...</button>");
      $info_state.append($state_change_btn);
      var $state_change = $$('state-change', {parent:$info_state}).css({display:'none'});
      var st = get_state_transitions(_state);
      if (st)
      {
        function add_choice(state)
        {
          var ss = get_state_name(state);
          var $ssc = $("<div class='state-change-choice'><i class='fa fa-circle-o'></i> "+ss+"</div>");
          $ssc.click(function(){
            selected = state;
            $last.removeClass('selected');
            $last.find('i').removeClass('fa-check-circle-o');
            $last.find('i').addClass('fa-circle-o');
            $ssc.addClass('selected');
            $ssc.find('i').removeClass('fa-circle-o');
            $ssc.find('i').addClass('fa-check-circle-o');
            $last = $ssc;
            $state_change_ok_btn.prop('disabled', false);
          });
          $state_change.append($ssc);
        }
        for (var i=0; i<st.length; i++)
          add_choice(st[i]);
        $state_change.append("<textarea></textarea>");
        var $state_change_ok_btn = $("<button>CHANGE STATUS</button>").prop('disabled',true);
        var $state_change_cancel_btn = $("<button>CANCEL</button>");
        $state_change.append($state_change_ok_btn, " ", $state_change_cancel_btn);
        $state_change_btn.click(function(){
          $state_change.show();
          $state_change_btn.hide();
        });
        $state_change_cancel_btn.click(function(){
          $state_change.hide();
          $state_change_btn.show();
        });
        $state_change_ok_btn.click(function(){
          $$ajax(self.app.base_url + '/status/'+type+'/'+_id, JSON.stringify({state:selected}), 'post').done(function(r){
            _state = selected;
            update_info();
            refresh_logs();
          });
        })
      }
    }

    var $info_rel = $$('related-panel', {parent: $info});
    var $info_del = $$('delete-panel', {parent: $info});
    var c = 0;
    function add_related_btn(type, r) {
      var f = new form_fields.model_field({type:type});
      f.data = r;
      var $m = f.$el();
      $m.dblclick(function () {
        console.log(r);
        self.emit('select', {type: type, id: r._id});
      });
      $info_rel.append($m);
      c++;
    }
    function add_delete_btn()
    {
      var $delete = $$('delete', {el:'button'}).text('DELETE '+type.toUpperCase()+'...');
      $info_del.append($delete);
      $delete.click(function(){
        $$ajax(self.app.base_url + '/delete/'+type+'/'+id, null, 'post').done(function(r){
          self.emit('close');
        });
      });
    }
    function add_reference_btn() {
      var $delete = $$('delete', {el:'button'}).text('REMOVE REFERENCES');
      $delete.click(function(){
        $$ajax(self.app.base_url + '/delete_references/'+type+'/'+id, null, 'post').done(function(r){
          _related = {};
          $info_rel.empty();
          for (var i=0; i< r.length; i++)
            $info_rel.append(r[i]+"<br>");
          $info_del.empty();
          refresh_logs();
          add_delete_btn();
        });
      });
      $info_del.append($delete);
    }
    for (var p in _related)
      for (var i=0; i<_related[p].length; i++)
        add_related_btn(p, _related[p][i]);
    if (c == 0)
    {
      add_delete_btn();
      $info_del.prepend("<h3>Careful</h3>");
    }
    else
    {
      add_reference_btn();
      $info_rel.prepend("<h3>References</h3>");
    }


    // logs
    var $info_logs = $$('logs-panel', {parent: $info});
    $info_logs.empty();
    if (_logs.length!=0)
    {
      $info_logs.append("<h3>Logs</h3>");
      var $c = $$('logs-panel-c', {parent: $info_logs});
      for (var i=0; i<_logs.length; i++)
       $c.append(get_log_row(_logs[i]));
    }
  }

  function get_log_row(log)
  {
    var $r = $$('log-row');
    $$('action', {parent: $r}).text(log.action);
    if (log.info.diffs) {
      for (var p in log.info.diffs)
      {
        $$('diff', {el:'span', parent: $r}).text(p+": ");
        log.info.diffs[p].forEach(function(part){
          var color = part.added ? 'added' :
            part.removed ? 'removed' : 'unchanged';
          $$('diff-'+color, {el:'span', parent: $r}).text(part.value);
        });
        $r.append('<br clear="both">');
     }
    }
    $$('time', {parent: $r}).html(timeSince(log.time)+" by <i>"+log.user.email+"</i>");
    return $r;
  }

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
      for (var p in n) {
        if (_idx[p])
          _idx[p].data = n[p];
      }
      update_ui();
    }
  });

  function update_ui()
  {
    update_controls();
    update_info();
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
      update_info();
    });
  }
}


function indicated_field(d)//, settings_callback)
{
  var self = this;
  var name = d.name;
  var label = d.label ? d.label : d.name;
  var type = d.widget;
  var $el = $$('control-group');
  self.$el = function () {
    return $el;
  }
  form_make_listener(self);

  var $label = $('<label></label>').addClass('control-label').attr('for', name).text(label);
  if (!form_fields[type + "_field"])
    throw Error("no field for " + type);
  var field = new form_fields[type + "_field"](d.options);
  form_make_listener(field);
  field.bubble_listener(self);
  self.field = field;
  $el.append($label, field.$el());
  field.$el().addClass('controls');

  Object.defineProperty(this, "data", {
    get: function () {
      return field.data;
    },
    set: function (n) {
      field.data = n;
    }
  });

  var lastCols = null;
  var cols = null;

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

  var showLabel = true;

  function label_update_ui() {
    $label.text(label);
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
  Object.defineProperty(this, "showLabel", {
    get: function () {
      return  showLabel;
    },
    set: function (n) {
      showLabel = n;
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



