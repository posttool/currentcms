function layers_layers(){
  var self = this;
  var $el = $$('layers');
  self.$el = function(){
    return $el;
  }
  var $user = $(".user");
  var $x = $("#extra-options");
  var $control_bar = $("#control-bar");
  var $info_panel = $("#info-panel");
  var $info_content = $("#info-panel-content");

  $("#info-cog").click(function(){
    toggle_info();
  });

  $(window).resize(update_widths)

  self.add_layer = function(f)
  {
    var $layer = $$('layer');
    $layer.data('__obj__', f);
    var $lens = $$('lens');
    $lens.click(function(){
      if ($el.children().length == 1)
        return;
      self.pop_layer();
      //emit close

    })
    var $c = $$('c');
    $c.append(f.$el());
    $layer.append($lens, $c);
    $el.append($layer);
    $layer.transition({x: 0});
    history_push();
    update_ui();

  }

  self.size = function()
  {
    return $el.children().length;
  }

  self.is_empty = function()
  {
    return $el.children().length == 0;
  }

  self.find = function (url) {
    var c = $el.children();
    for (var i = 0; i < c.length; i++) {
      var $c = $(c[i]);
      var f = $c.data('__obj__');

      if (url == f.url()) {
        return i;
      }
    }
    return -1;
  }

  self.clear_layers = function()
  {
    $el.empty();
    update_ui();
  }


  self.pop_layer = function()
  {
    pop_child();
    //history_push();
    update_ui();
    refresh_last();
  }

  self.pop_to = function (url) {
    var i = self.find(url);
    var x = $el.children().length - i - 1;
    for (var i=0; i<x; i++)
      pop_child();
    history_push();
    update_ui();
    refresh_last();
  }


  function update_ui() {
    var c = $el.children();
    for (var i = 0; i < c.length; i++) {
      var $c = $(c[i]);
//      var lp = (i*50)+'px';
//      var wp = (available_width - (i*50)) + 'px';
      if (i == c.length - 1)
        $c.css({position: 'absolute'}); //, left: lp, width: wp
      else
        $c.css({position: 'fixed'});
      $c.css({x: 0});
    }

    $x.empty();
    for (var i = 0; i < c.length; i++) {
      var f = $(c[i]).data('__obj__');
      (function (f) {
        var $r = $('<span class="nav-item"><i class="fa fa-angle-right"></i> ' + f.toString()+'</span>');
        $r.click(function () {
          self.pop_to(f.url())
        });
        $x.append($r);
      })(f);

      update_widths();
    }

    $control_bar.empty();
    $info_content.empty();
    var f = $el.children().last().data('__obj__');
    if (f)
    {
      if (f.$controls)
        $control_bar.append(f.$controls());
      if (f.$info)
        $info_content.append(f.$info());
    }
    $control_bar.css({x: 0});
  }

  function history_push()
  {
    var f = $el.children().last().data('__obj__');
    history.pushState(f.url(), f.toString(), f.url());
    document.title =  f.toString();
  }

  function pop_child() {
    var $l = $el.children().last();
    var o = $l.data('__obj__');
    if (o && o.destroy)
      o.destroy();
    var $c = $($l);
    $c.remove();
  }

  function refresh_last()
  {
    var f = $el.children().last().data('__obj__');
    f.refresh();
  }

  function init_nav()
  {
    dhova(2400, $("#tool-bar"), function () {
        var c = $el.children();
        for (var i = 0; i < c.length; i++) {
          var $c = $(c[i]);
          $c.transition({x: i * 150});
        }
        $control_bar.transition({x: (i-1) * 150});
      },
      function () {
        var c = $el.children();
        for (var i = 0; i < c.length; i++) {
          var $c = $(c[i]);
          $c.transition({x: 0});
        }
        $control_bar.transition({x: 0});
      });
  }
  init_nav();


  var info_open = true;
  function toggle_info()
  {
    info_open = !info_open;
    update_info();
  }

  var available_width = 0;
  var info_width = 250;
  var info_off = 30;
  function update_info(f)
  {
    if (!f)
      f = 'transition';
    available_width = info_open ? $(window).width() - info_width : $(window).width() - info_off;
    var cw = available_width + 'px';
    var iw = info_width + 'px';
    var uw = info_open ? (info_width + 20) + 'px' : '50px';
    var r = info_open ? '0' : (info_off-info_width) + 'px';
    var c = $el.children();
    for (var i = 0; i < c.length; i++) {
      var $c = $(c[i]);
      $c[f]({width:cw});
    }
    $user[f]({right: uw});
    $control_bar[f]({width:cw});
    $info_panel[f]({right:r, width: iw});
    $info_content[f]({opacity: info_open ? 1 : 0})
  }

  function update_widths(){
    update_info('css');
  }




  //
  function dhova(entasis, $e, a, b) {
    var id = -1;
    $e.hover(function () {
        if (id != -1)
          return;
        id = setTimeout(function () {
          id = -1;
          a();
        }, entasis);
      },
      function () {
        if (id != -1) {
          clearTimeout(id);
          id = -1;
          return;
        }
        b();
      })
  }
}
