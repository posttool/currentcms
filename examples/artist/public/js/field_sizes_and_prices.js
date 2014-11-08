form_fields["sizes_and_prices_field"] = function () {
  console.log("LOADED sizes and prices field")
  var self = this;
  var $el = $$("sizes_and_prices").data("__obj__", self);;
  self.$el = function () { return $el; };
  self.$cel = function () { return f.$cel(); };

  var f = new form_fields.add_remove(sp_input_field, {
    addText: "Add", type: "info", browse: false, deletableRowClassName: 'x', floats: false,
    placeholders: ['20x24','$4000','12']});
  $el.append(f.$el());
  f.add_listener("add", function (f) { f.push(["","", ""]); });
  f.add_listener("change", function(){ self.emit('change'); });

  Object.defineProperty(self, "data", {
    get: function () {
      return f.data;
    },
    set: function (n) {
      f.data = n;
    }
  });
};

function sp_input_field(options) {
  var self = this;
  var $el = $$('').data("__obj__", self);;
  self.$el = function () { return $el; }

  var cssprops = {float:'left', width: '130px', margin: '0 8px 12px 0', 'font-size': '14px', padding: '5px'};
  for (var i=0; i<options.placeholders.length; i++) {
    (function (ph, idx) {
      var $c = $("<input type='text' placeholder='" + ph + "'/>").css(cssprops);
      $c.keyup(function () {
        _n[idx] = $c.val();
        self.emit('change');
      });
      $el.append($c);
    })(options.placeholders[i], i);
  }

  var _n = new Array(options.placeholders.length);
  Object.defineProperty(this, "data",
    {
      get: function () {
        return {_id: _n}; // the id goes around it cause add_remove is oriented to _id right now, sorry!
      },
      set: function (n) {
        if (!$.isArray(n))
          throw new Error("cant pass that here");
        _n = n;
        update_ui();
      }
    });

  function update_ui() {
    var c = $el.children()
    for (var i=0; i<_n.length && i< c.length; i++) {
      $(c[i]).val(_n[i]);
    }
  }


}
