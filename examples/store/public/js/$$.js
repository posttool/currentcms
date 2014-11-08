function tabgroup() {
  var self = this;
  eventify(self);
  var $el = $$().addClass('tabgroup');
  self.$el = $el;
  var tabs = [];
  self.idx = 0;
  self.append = function (t) {
    var idx = tabs.length;
    $el.append(t.$el);
    tabs.push(t);
    t.addListener('select', function () {
      self.show(idx);
    });
  }
  self.empty = function () {
    $el.empty();
    tabs = [];
  }
  self.show = function (idx) {
    for (var i = 0; i < tabs.length; i++)
      tabs[i].show(false);
    tabs[idx].show(true);
    self.idx = idx;
  }
  self.next = function () {
    self.idx++;
    if (self.idx >= tabs.length)
      self.idx = 0;
    self.show(self.idx);
  }
}

function tab1(name, $pane) {
  var self = this;
  eventify(self);
  var $d = $$();
  var $t = $$($d).text(name).addClass('tab');
  var $dp = $$($d).css({'display': 'none'});
  $dp.append($pane);
  //
  var vis = false;
  self.$el = $d;
  function update() {
    if (vis)
      $t.addClass('selected');
    else
      $t.removeClass('selected');
    $dp.css({'display': vis ? 'block' : 'none'});
  }

  self.show = function (b) {
    vis = b;
    update();
  }
  self.toggle = function () {
    vis = !vis;
    update();
  }
  $t.click(function () {
    self.emit('select')
  });
}

function alert(title, $pane, on_close) {
  var $c = $$().addClass('alert-gauze');
  var $d = $$().addClass('alert-wrap');
  var $a = $$($d).addClass('alert');
  var $h = $$($a).addClass('head');
  var $p = $$($a).addClass('content');
  var $b = $$($a).addClass('buttons')
  var $ok = $$($b).text('ok');
  var $cancel = $$($b).text('cancel');
  $(document.body).append($c);
  $(document.body).append($d);
  function empty() {
    $d.remove();
    $c.remove();
  }

  $h.text(title);
  $p.append($pane);
  $c.click(empty);
  $ok.click(function () {
    empty();
    on_close();
  });
  $cancel.click(empty)
}

function add_remove(type, form_class, item_renderer) {
  var self = this;
  eventify(self);
  var $d = $$();
  var $t = $$($d);
  var $bb = $$($d);
  var $b1 = $$($bb, {el: 'button'}).text('add');
  self.$el = $d;

  $b1.click(function () {
    var form = new form_class();
    alert("Add " + type, form.$el, function () {
      self.push(form.data);
      self.emit('add', form.data);
    })
  });

  var cells = [];
  self.push = function(data) {
    var r = new add_remove_item(type, item_renderer);
    r.data = data;
    r.on('remove', function () {
      r.$el.remove();
      cells.splice(cells.indexOf(r), 1);
      self.emit('remove', r.data);
    });
    r.on('select', function (data) {
      self.select(data._id);
      self.emit('select', data);
    });
    $t.append(r.$el);
    cells.push(r);
  }

  self.select = function (data) {
    for (var i = 0; i < cells.length; i++) {
      if (cells[i].data._id == data)
        cells[i].$el.addClass('selected');
      else
        cells[i].$el.removeClass('selected');
    }
  }
}

function add_remove_item(type, item_renderer) {
  var self = this;
  eventify(self);
  valuable(self, update);
  var $d = $$().addClass('item ' + type.toLowerCase());
  var $i = $$($d, {el: 'span'}).addClass('item val')
  var $r = $$($d, {el: 'span'}).html('<i class="fa fa-times"></i>');
  self.$el = $d;

  function update() {
    $i.html(item_renderer(self._data))
  }
  $r.click(function () {
    self.emit('remove', self._data)
  });
  $i.click(function(){
    self.emit('select', self._data);
  })
}

// labeled input...
function labeled_input(message) {
  var self = this;
  string_component(self, message, "<input type=\"text\">");
}

// text area
function labeled_textarea(message) {
  var self = this;
  string_component(self, message, "<textarea></textarea>");
}

// simple component !
function string_component(self, message, component) {
  eventify(self);
  valuable(self, update, '');
  var $c = $$().addClass('control');
  var $l = $("<label>" + message + "</label>");
  var $i = $(component);
  $c.append($l, $i);
  self.$el = $c;
  function update() {
    $i.val(self._data);
  }

  $i.on('change', function () {
    self._data = $i.val();
    self.emit('change');
  })
}

// [o]
function $$($p, o) {
  var el = 'div';
  if (o && o.el) el = o.el;
  var $t = $('<' + el + '></' + el + '>');
  if (o) {
    if (o.text)
      $t.text(o.text);
    if (o.class)
      $t.addClass(o.class);
  }
  if ($p)
    $p.append($t);
  return $t;
}

// listen
function eventify(o) {
  var listeners = {};
  o.addListener = function (name, f) {
    if (!f)
      return;
    if (listeners[name])
      listeners[name].push(f);
    else
      listeners[name] = [f];
  }
  o.on = o.addListener;
  o.removeListeners = function (name) {
    delete listeners[name];
  }
  o.emit = function (name, value) {
    if (listeners[name])
      for (var i = 0; i < listeners[name].length; i++)
        listeners[name][i](value);
  }
}

// with value
function valuable(o, update, init) {
  o._data = init;
  Object.defineProperty(o, 'data', {
    get: function () {
      return o._data;
    },
    set: function (value) {
      o._data = value;
      update();
    }
  });
}


// form field utility
function attributable(form, c, name) {
  if (form._vals == null)
    form._vals = {};
  if (form._update == null)
    form._update = function () {
      for (var p in form._vals)
        form._vals[p].data == form._data[p];
    }
  form._vals[name] = c;
  c.on('change', function () {
    form._data[name] = c.data;
    form.emit('change');
  });
}

