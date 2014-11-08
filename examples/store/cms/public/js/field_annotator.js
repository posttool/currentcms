form_fields["annotator_field"] = function () {
  var self = this;
  var $el = $$("annotator").data("__obj__", self);
  var $cel = $$("annotator-controls").data("__obj__", self);
  self.$el = function () { return $el; };
  self.$cel = function () { return $cel; };
  var schema_fields = [];
  self.init = function(){
    self.form.add_listener('change', function(){
      update_ui();
    });
    retry_get_schema_data();
    function retry_get_schema_data() {
      if (self.form.data._id != null)
        get_schema_data();
      else
        setTimeout(retry_get_schema_data, 750);
    }
    function get_schema_data() {
      $$ajax('/schema/' + self.form.data._id).done(function (o) {
        schema_fields = [];
        for (var i = 0; i < o.fields.length; i++)
          schema_fields.push(o.fields[i].name);
      }).error(retry_get_schema_data);
    }
  };

  var _ranges = [];
  Object.defineProperty(self, "data", {
    get: function () {
      return _ranges;
    },
    set: function (n) {
      if (!n) n = [];
      _ranges = n;
      update_ui();
    }
  });

  function range_index_for_token_index(idx) {
    for (var i=0; i<_ranges.length; i++) {
      if (_ranges[i].range[0] == idx)
        return i;
    }
    return -1;
  }

  function is_left_side_of_range(idx) {
    var i = range_index_for_token_index(idx);
    return i != -1;
  }

  function between_range(r, i) {
    return r[0] <= i && i <= r[1];
  }

  function intersects_range(r) {
    for (var i=0; i<_ranges.length; i++) {
      if (between_range(_ranges[i].range, r[0]) || between_range(_ranges[i].range, r[1]))
        return _ranges[i];
    }
    return null;
  }

  function is_in_range(idx) {
    for (var i=0; i<_ranges.length; i++) {
      if (between_range(_ranges[i].range, idx))
        return true;
    }
    return false;
  }

  var selected = -1;
  function update_ui() {
    var tokens = tokenize(self.form.data.text);
    var $x = $$();
    var $xc = []; // the token lists
    var clicked = -1;
    var range;

    function $t(idx) {
      return $xc[idx];;
    }

    function $t_over(idx) {
      if (idx < clicked)
        range = [idx, clicked];
      else
        range = [clicked, idx];
      for (var i = 0; i < tokens.length; i++)
        $t(i).removeClass('select');
      for (var i = range[0]; i < range[1] + 1; i++)
        $t(i).addClass('select');
    }

    function add_range() {
      if (intersects_range(range)) {
        clicked = -1;
        selected = -1;
        range = null;
      } else {
        _ranges.push({range: range, type: null});
        selected = _ranges.length - 1;
      }
      update_ui();
    }

    function range_ui(idx){
      var $d = $$('annotation-marker');
      var r = _ranges[idx];
      var $t = $$().text(r ? r.type : "None");
      $d.append($t);
      $t.click(add_select_ui);
      if (idx == selected)
        add_select_ui();
      function add_select_ui(){
        $t.hide();
        var $s = $$();
        var s = new select_field({options:schema_fields});
        r = _ranges[idx];
        s.data = schema_fields.indexOf(r.type);
        var $da = $$('del').addClass("fa fa-times-circle").text(" Delete");
        var $dx = $$('del').addClass("fa fa-check-circle").text(" OK");
        $s.append(s.$el(),  "<br>", $da, "<br>", $dx);
        $d.append($s);
        $da.click(function(){
          _ranges.splice(idx, 1);
          selected = -1;
          self.emit('change');
        });
        s.add_listener('change', function(){
          r.type = schema_fields[s.data];
          selected = -1;
          self.emit('change');
        });
        $dx.click(function(){
          r.type = schema_fields[s.data];
          selected = -1;
          self.emit('change');
       });
      }
      return $d;
    }

    // redraw tokens
    for (var i=0; i<tokens.length; i++)
    {
      // each token (and annotions)
      (function (token, idx) {
        var $s = $$("token");
        $s.text(token);
        $s.mousedown(function () {
          clicked = idx;
          range = null;
          $t_over(idx);
        });
        $s.mouseover(function(){
          if (clicked != -1)
            $t_over(idx);
        });
        if (is_left_side_of_range(idx))
          $x.append(range_ui(range_index_for_token_index(idx)));
        if (is_in_range(idx))
          $s.addClass('annotated')
        $x.append($s);
        $xc.push($s);
      })(tokens[i], i);
      // mouseup anywhere
      $(document).unbind("mouseup");
      $(document).mouseup(function(){
        if (clicked == -1)
          return;
        clicked = -1;
        add_range();
      });
    }

    $el.empty().append($x, "<br clear='all'>");
  }
};

// custom select
function select_field(options) {
  var self = this;
  var $el = mixin_basic_component(self, "select");
  mixin_emitter(self);

  var _sel_idx = -1;
  Object.defineProperty(self, "data", {
    get: function () {
      return _sel_idx;
    },
    set: function (n) {
      if (n == null || n < 0 || n > options.options.length) n = -1;
      _sel_idx = n;
      update_ui();
    }
  });

  function update_ui(){
    $el.empty();
    for (var i=0; i<options.options.length; i++){
      (function(o,i){
        var $o = $$('ooption');
        if (_sel_idx == i)
          $o.addClass('selected');
        $o.text(o);
        $o.click(function(){
          self.data = i;
          self.emit('change');
        })
        $el.append($o);
      })(options.options[i], i);
    }
  }
}

// text utility
function tokenize(text) {
  if (text == null || text == "")
    return [];
  var tokens = [];
  var s = "";
  for (var i=0; i<text.length; i++) {
    var c = text.charAt(i);
    if (c == " ")
    {
      if (s)
        tokens.push(s);
      s = "";
    } else if (c == "." || c == "," || c == "!" || c == "?") {
      if (s)
        tokens.push(s);
      s = "";
      tokens.push(c);
    } else {
      s += c;
    }
  }
  if (s)
    tokens.push(s);
  return tokens;
}