var form_fields = {

  boolean_field: function (options) {
    var self = this;
    mixin_emitter(self);
    var $el = $$('field boolean');
    self.$el = function () {
      return $el;
    }

    var $c = $("<i class='fa fa-check-square-o'></i>");
    $el.append($c);
    if (options && options.text)
    {
      var $d = $("<span>"+options.text+"</span>");
      $el.append($d);
    }

    var _b = false;
    Object.defineProperty(self, "data",
      {
        get: function () {
          return _b;
        },
        set: function (n) {
          _b = n;
          update_ui();
        }
      });
    function update_ui() {
      if (_b) $c.removeClass('fa-square-o').addClass('fa-check-square-o');
      else $c.removeClass('fa-check-square-o').addClass('fa-square-o');
    }
    update_ui();

    $c.click(function () {
      self.data = !self.data;
      update_ui();
      self.emit('change');
    });
  },

  number_field: function (options) {
    var self = this;
    mixin_emitter(self);
    var $el = $$('field number');
    this.$el = function () {
      return $el;
    }

    var $c = $("<input type='number'/>").addClass("form-control");
    $el.append($c);

    var _n = 0;
    Object.defineProperty(this, "data",
      {
        get: function () {
          return _n;
        },
        set: function (n) {
          _n = n;
          update_ui();
        }
      });
    function update_ui() {
      $c.val(_n);
    }

    $c.keyup(function () {
      _n = $c.val();
      self.emit('change');
    });
  },

  range_field: function (options) {
    var self = this;
    mixin_emitter(self);
    var $el = $$('field range');
    this.$el = function () {
      return $el;
    }

    var $c = $("<input type='range'/>").addClass("form-control");
    $el.append($c);
    if (options) {
      for (var p in options) {
        $c.prop(p, options[p]);
      }
    }

    var _n = 0;
    Object.defineProperty(this, "data",
      {
        get: function () {
          return _n;
        },
        set: function (n) {
          _n = n;
          update_ui();
        }
      });
    function update_ui() {
      $c.val(_n);
    }

    $c.keyup(function () {
      _n = $c.val();
      self.emit('change');
    });
  },


  input_field: function (options) {
    var self = this;
    mixin_emitter(self);
    var $el = $$('field string');
    this.$el = function () {
      return $el;
    }

    var $c = $("<input type='text'/>").addClass("form-control");
    $el.append($c);

    var _n = "";
    Object.defineProperty(this, "data",
      {
        get: function () {
          return _n;
        },
        set: function (n) {
          _n = n;
          update_ui();
        }
      });
    function update_ui() {
      $c.val(_n);
    }

    $c.keyup(function () {
      _n = $c.val();
      self.emit('change');
    });
  },

  email_field: function (options) {
    var self = this;
    mixin_emitter(self);
    var $el = $$('field string');
    this.$el = function () {
      return $el;
    }

    var $c = $("<input type='email'/>").addClass("form-control");
    $el.append($c);

    var _n = "";
    Object.defineProperty(this, "data",
      {
        get: function () {
          return _n;
        },
        set: function (n) {
          _n = n;
          update_ui();
        }
      });
    function update_ui() {
      $c.val(_n);
    }

    $c.keyup(function () {
      _n = $c.val();
      self.emit('change');
    });
  },


  password_field: function (options) {
    var self = this;
    mixin_emitter(self);
    var $el = $$('field string');
    this.$el = function () {
      return $el;
    }

    var $c = $("<input type='password'/>").addClass("form-control");
    $el.append($c);

    var _n = "";
    Object.defineProperty(this, "data",
      {
        get: function () {
          return _n;
        },
        set: function (n) {
          _n = n;
          update_ui();
        }
      });
    function update_ui() {
      $c.val(_n);
    }

    $c.keyup(function () {
      _n = $c.val();
      self.emit('change');
    });
  },


  textarea_field: function (options) {
    var self = this;
    mixin_emitter(self);
    var $el = $$('field textarea');
    this.$el = function () {
      return $el;
    }

    var $c = $("<textarea/>").addClass("form-control");
    $el.append($c);

    var _n = "";
    Object.defineProperty(this, "data",
      {
        get: function () {
          return _n;
        },
        set: function (n) {
          _n = n;
          update_ui();
        }
      });
    function update_ui() {
      $c.val(_n);
    }

    $c.keyup(function () {
      _n = $c.val();
      self.emit('change');
    });
  },


  select_field: function (options) {
    var self = this;
    mixin_emitter(self);
    var $el = $$('field string');
    this.$el = function () {
      return $el;
    }

    var $c = $("<select/>").addClass("form-control");
    $el.append($c);
    if (options && options.options)
    {
      for (var i=0; i<options.options.length; i++) {
        var o = options.options[i];
      if (typeof(o) == 'string') {
          $c.append("<option>"+o+"</option>");
        } else if (o._id && o.name) {
          $c.append("<option value='"+o._id+"'>"+o.name+"</option>");
          console.log(o);
        }
      }

    }

    var _n = "";
    Object.defineProperty(this, "data",
      {
        get: function () {
          return _n;
        },
        set: function (n) {
          _n = n;
          update_ui();
        }
      });
    function update_ui() {
      $c.val(_n);
    }

    $c.change(function () {
      _n = $c.find('option:selected').text();
      self.emit('change');
    });
  },


  code_field: function (options) {
    // super
    var self = this;
    mixin_emitter(self);
    var $el = $$('field code');
    self.$el = function () {
      return $el;
    }
    // widget
    var $w = $("<textarea></textarea>").addClass("form-control");
    $el.append($w); //code mirror requires the appending before...
    var cm = CodeMirror.fromTextArea($w[0], $.extend({}, {}));

    var _s = "";
    Object.defineProperty(self, "data",
      {
        get: function () {
          return _s;
        },
        set: function (n) {
          _s = n;
          update_ui();
        }
      });
    function update_ui() {
      cm.setValue(_s);
    }

    cm.on('change', function () {
      _s = cm.getValue();
      self.emit('change');
    });

  },

  rich_text_field: function (options) {
    var self = this;
    mixin_emitter(self);
    var $el = $$('field rich-text');
    self.$el = function () {
      return $el;
    }

    var $w = $("<textarea></textarea>");
    $el.append($w);
    var _ck = CKEDITOR.replace($w[0]);

    var _s = "";
    Object.defineProperty(self, "data",
      {
        get: function () {
          return _s;
        },
        set: function (n) {
          if (!n) n = "";
          _s = n.replace(/<[\/]{0,1}(root|ROOT)[^><]*>/g,"");;
          update_ui();
        }
      });
    function update_ui() {
      _ck.setData(_s);
    }

    _ck.on('change', function () {
      _s = _ck.getData();
      self.emit('change');
    });


  },

  qrich_text_field: function(options) {
    var self = this;
    mixin_emitter(self);
    var $el = $$('field rich-text');
    self.$el = function () {
      return $el;
    }

    var $w = $('<div>\
        <div class="toolbar-container">\
          <span class="ql-format-group">\
            <select title="Font" class="ql-font">\
              <option value="sans-serif" selected>Sans Serif</option>\
              <option value="Georgia, serif">Serif</option>\
              <option value="Monaco, &quot;Courier New&quot;, monospace">Monospace</option>\
            </select>\
            <select title="Size" class="ql-size">\
              <option value="10px">Small</option>\
              <option value="13px" selected>Normal</option>\
              <option value="18px">Large</option>\
              <option value="32px">Huge</option>\
            </select></span><span class="ql-format-group"><span title="Bold" class="ql-format-button ql-bold"></span><span class="ql-format-separator"></span><span title="Italic" class="ql-format-button ql-italic"></span><span class="ql-format-separator"></span><span title="Underline" class="ql-format-button ql-underline"></span></span><span class="ql-format-group">\
            <select title="Text Alignment" class="ql-align">\
              <option value="left" selected></option>\
              <option value="center"></option>\
              <option value="right"></option>\
              <option value="justify"></option>\
            </select>\
          </span>\
          <span class="ql-format-group">\
            <span title="Link" class="ql-format-button ql-link"></span>\
            <span class="ql-format-separator"></span>\
            <span title="Image" class="ql-format-button ql-image"></span>\
            <span class="ql-format-separator"></span>\
            <span title="Bullet" class="ql-format-button ql-bullet"></span>\
            </span><span class="ql-format-group">\
          </span>\
        </div>\
        <div class="editor-container"></div>\
      </div>');
    $el.append($w);
    console.log($w.html())
    var fullEditor = new Quill($w.get(), {
      theme: 'snow'
    });


    var _s = "";
    Object.defineProperty(self, "data",
      {
        get: function () {
          return _s;
        },
        set: function (n) {
          _s = n;
          update_ui();
        }
      });
    function update_ui() {
      //fullEditor.setHTML(_s);
    }

//    fullEditor.on('text-change', function(delta, source) {
//      if (source == 'api') {
//        //console.log("An API call triggered this change.");
//      } else if (source == 'user') {
//        //console.log("A user action triggered this change.");
//        _s = fullEditor.getHTML();
//        self.emit('change');
//      }
//    });


  },

  datetime_field: function (options) {
    var self = this;
    mixin_emitter(self);
    var $el = $$('field date');
    this.$el = function () {
      return $el;
    }

    var $c = $("<input type='datetime-local'/>").addClass("form-control");
    $el.append($c);

    var _d = new Date();
    Object.defineProperty(this, "data", {
      get: function () {
        return new Date(_d);
      },
      set: function (n) {

        if (n)
          _d = n.substring(0,16);
        else
          _d = '';
        update_ui();
      }
    });
    function update_ui() {
      $c.val(_d);
    }

    $c.keyup(function () {
      _d = $c.val();
      self.emit('change');
    });
  },

  upload_field: function (options) {
    var self = this;
    mixin_emitter(self);
    var $el = $$('field resource');
    this.$el = function () {
      return $el;
    }
    var $cel = $$('controls resource');
    this.$cel = function () {
      return $cel;
    }

    var $progress = $$('progress');
    var $progressbar = $$('bar', { css: { width: '0%' }, parent: $progress });
    var $content = $$('');
    var $info = $$('multi-drop-area').text('Drop file here or click Upload.');
    var $btn = $$('btn btn-small file-input-button', {
      children: [ $('<button><i class="fa fa-arrow-circle-o-up"></i> Upload file...</button>') ] });
    var $fileupload = $$('multi_upload', { el: 'input', parent: $btn,
      data: { url: upload_url },
      attributes: { type: 'file', name: 'file', multiple: 'multiple' }});
    $el.append($progress, $content);
    $cel.append($btn)

    var o = $.extend({add: false, browse: false}, options);
    var f = new form_fields.add_remove(options.cellRenderer ? options.cellRenderer : form_fields.model_field, o);
    f.bubble_listener(self);
    $content.append(f.$el());

    Object.defineProperty(this, "data", {
      get: function () {
        return f.data;
      },
      set: function (n) {
        f.data = n;
        update_ui();
      }
    });

    function update_ui(){
      if (!options.array && f.data)
      {
        $info.hide();
        $btn.hide();
      }
      else
      {
        $info.show();
        $btn.show();
      }
    }

    $fileupload.fileupload({
      dataType: 'json',
      dropZone: $el,
      add: function (e, edata) {
        //if (data.valid && !edata.files[0].name.match(data.valid))
        //  return;
        $progress.show();
        $info.hide();
        $btn.hide();
        edata.submit();
      },
      progress: function (e, edata) {
        console.log(edata);
        var progress = parseInt(edata.loaded / edata.total * 100, 10);
        $progress.show();
        $info.hide();
        $btn.hide();
        $progressbar.css('width', progress + '%');
      },
      done: function (e, edata) {
        $progress.hide();
        $content.show();
        if (options.array)
          f.push(edata.result);
        else
          f.update(edata.result);
        update_ui();
        self.emit('change');
      },
      error: function (e) {
        console.log("ERR", e);
      }
    });
  },

  model_field: function (options) {
    var self = this;
    mixin_emitter(self);
    var $el = $$('model');
    form_make_listener(self);
    self.$el = function () {
      return $el;
    };

    var is_resource = options.type == 'Resource';
    var _d = null;
    Object.defineProperty(this, "data", {
      get: function () {
        return _d;
      },
      set: function (n) {
        _d = n;
        update_ui();
      }
    });
    function update_ui() {
      $el.empty();
      var t = render_template(options.type, _d).trim();
      if (t)
        $el.append('<div class="text">'+t+'</div>');
      if (is_resource)
        $el.append(form_fields.resource(_d));
//      var thumb = find_thumb2(_d);
//      if (thumb)
//        bg_w_grad($el, thumb);
    }

    $el.dblclick(function () {
      self.emit('select', self.data);
    })
  },

  resource: function(data)
  {
    var mime = data.mime ? data.mime : data.meta && data.meta.mime ? data.meta.mime : null;
    if (mime && mime.indexOf('image') == 0){
        var thumb = find_thumb2(data);
       if (thumb)
          return $('<img src="'+thumb+'">');
      return $('<img src="'+media_path(data) +'">');
    } else if (mime && mime.indexOf('audio') == 0) {
      return $('<audio controls><source src="'+media_path(data)+'" type="'+data.mime+'"></audio>');
    } else if (mime && mime.indexOf('video') == 0) {
      return $('<video controls><source src="'+media_path(data)+'" type="'+data.mime+'"></video>');
    } else if (data.path) {
      return $('<a href="'+media_path(data)+'">'+data.path+"</a>");
    } else {
      return media_path(data);
    }
  },

  //path
  // /cms/download/id
  // http...cloudacity...

  resource_meta_field: function(options) {
    var self = this;
    mixin_emitter(self);
    var $el = $$('resource-path');
    self.$el = function () {
      return $el;
    };

    var _d = null;
    Object.defineProperty(this, "data", {
      get: function () {
        return _d;
      },
      set: function (n) {
        _d = n;
        update_ui();
      }
    });
    function update_ui() {
      $el.empty();
      if (_d)
        $el.append("<img src='"+find_thumb2(self.form.data)+"'><br><a href='"+ _d.url+"'>"+_d.url.substring(0,55)+"...</a><br>"+_d.width+"x"+_d.height+"px "+(_d.bytes/1024).toFixed(2)+"k");
    }
  },

  json_field: function(options) {
    var self = this;
    mixin_emitter(self);
    var $el = $$('json');
    self.$el = function () {
      return $el;
    };

    var _d = null;
    Object.defineProperty(this, "data", {
      get: function () {
        return _d;
      },
      set: function (n) {
        _d = n;
        update_ui();
      }
    });
    function update_ui() {
      $el.empty();
      if (_d)
        $el.append('<pre>'+JSON.stringify(_d)+'</pre>');
    }
  },

  table_field: function(options) {
    var self = this;
    mixin_emitter(self);
    var $el = $$('table');
    self.$el = function () {
      return $el;
    };

    var _d = null;
    Object.defineProperty(this, "data", {
      get: function () {
        return _d;
      },
      set: function (n) {
        _d = n;
        update_ui();
      }
    });
    function update_ui() {
      $el.empty();
      var $table = $$("body");
      $el.append($table);
      var s = options.fields.length;
      var $th = $$('crow nowrap');
      $table.append($th);
      for (var j=0; j<s; j++) {
        var f = options.fields[j];
        var $td = $$('hcol nowrap');
        $td.css({width: Math.floor(100/s)+"%"})
        $td.text(f);
        $th.append($td);
      }

      _d.forEach(function(row){
        var $tr = $$('crow nowrap');
        $table.append($tr);
        for (var j=0; j<s; j++) {
          var f = options.fields[j];
          var $td = $$('ccol nowrap');
          $td.css({width: Math.floor(100/s)+"%"})
          $td.text(row[f]);
          $tr.append($td);
        }
        $tr.click(function(){
          console.log(row)
          self.emit('select', row);
        })
      });
    }
  },

  choose_create_field: function (options) {
    var self = this;
    mixin_emitter(self);
    var $el = $$('field choose_create');
    this.$el = function () {
      return $el;
    };
    var $cel = $$('controls choose_create');
    this.$cel = function () {
      return $cel;
    };

    var f = new form_fields.add_remove(form_fields.model_field, options);
    f.bubble_listener(self);
    $el.append(f.$el());
    $cel.append(f.$cel());

    Object.defineProperty(this, "data", {
      get: function () {
        return f.data;
      },
      set: function (n) {
        f.data = n;
      }
    });

    self.push = function(e){f.push(e);}
    self.update = function(e){f.update(e);}

  },

  many_reference_field: function ($el) {
    $el = form_field_create(self, $el);
    var f = new form_fields.add_remove(form_fields.model_field);
    $el.append(f.$el());
    this.$el = function () {
      return $el;
    };

    Object.defineProperty(this, "data", {
      get: function () {
        return f.data;
      },
      set: function (n) {
        f.data = n;
      }
    });
  },

  add_remove: function (clazz, options) {
    var self = this;
    form_make_listener(self);
    var $el = $$();
    this.$el = function () {
      return $el;
    };
    var $cel = $$();
    this.$cel = function () {
      return $cel;
    };

    options = $.extend({add: true, addText: "Create", browse: true, browseText: "Browse", array: true, floats: true}, options);

    var $list = $("<div></div>");
    $el.append($list);
    if (options.floats)
      $el.append('<br clear="both">');
    $list.sortable({change: function (event, ui) {
      self.emit('change');
    }});

    if (options.add || options.browse)
    {
      var $actions = $("<div style='clear:both;'></div>");
      var $add = $("<button><i class='fa fa-plus-circle'></i> "+options.addText+" "+options.type+"</button>").css({'cursor': 'pointer'});
      var $browse = $("<button><i class='fa fa-play-circle'></i> "+options.browseText+"</button>").css({'cursor': 'pointer'});
      if (options.add)
        $actions.append($add, '&nbsp;');
      if (options.browse)
        $actions.append($browse, '&nbsp;');
      $cel.append($actions);
      $add.click(function () {
        self.emit('add');
      });
      $browse.click(function () {
        self.emit('browse');
      });
    }

    Object.defineProperty(this, "data", {
      get: function () {
        if (options.array) {
          var vals = [];
          $list.children().each(function (i, e) {
            var o = $(e).data("__obj__");
            vals.push(o.data._id);
          });
          return vals;
        } else {
          var val = null;
          $list.children().each(function (i, e) {
            var o = $(e).data("__obj__");
            val = o.data._id;
          });
          return val;
        }
      },
      set: function (o) {
        $list.empty();
        if (!o)
          return;
        if (options.array)
          for (var i = 0; i < o.length; i++)
            self.push(o[i]);
        else
            self.push(o);
      }
    });

    self.push = function(data) {
      var d = new form_fields.deletable_row(clazz, options);
      d.data = data;
      d.bubble_listener(self);
      $list.append(d.$el());
      return d;
    }
    self.update = function(data) {
      return self.push(data);
    }

  },

  deletable_row: function (clazz, options) {
    var self = this;
    form_make_listener(self);

    options = $.extend({deletableRowClassName: 'deletable-row'}, options);

    var $el = $$(options.deletableRowClassName).data("__obj__", this);
    this.$el = function () {
      return $el;
    }


    var $c = $$('comp');
    var c = new clazz(options);
    if (!c.bubble_listener)
      form_make_listener(c);
    c.bubble_listener(self);
    var $x = $$('del').addClass("fa fa-times-circle");
    $el.append($c, $x, $('<br clear="both">'));
    $c.append(c.$el());
    $x.click(function () {
      self.emit('change');
      $el.remove();
    });

    Object.defineProperty(this, "data", {
      get: function () {
        return c.data;
      },
      set: function (n) {
        c.data = n;
      }
    });


  },

//  group_field: function () {
//    var self = this;
//    var $el = $("<div></div>").addClass("group row");
//    this.$el = function () {
//      return $el;
//    }
//
//    var _d = {};
//    Object.defineProperty(this, "data", {
//      get: function () {
//        return _d;
//      },
//      set: function (n) {
//        _d = n;
//        update_ui();
//      }
//    });
//    function update_ui() {
//      for (var p in _c)
//        _c[p].data = _d[p];
//    }
//
//    var _c = {};
//    this.append = function (c) {
//      $el.append(c.$el());
//      _c[c.name] = _c;
//      c.change(function () {
//        _d[c.name] = c.data;
//        self.emit('change');
//      })
//    }
//
//  },
//
//  break_field: function () {
//    var $el = $("<div></div>").addClass("clearfix");
//    this.$el = function () {
//      return $el;
//    }
//
//    var _d = null;
//    Object.defineProperty(this, "data", {
//      get: function () {
//        return _d;
//      },
//      set: function (n) {
//        _d = n;
//        update_ui();
//      }
//    });
//    function update_ui() {
//    }
//
//  }
}
