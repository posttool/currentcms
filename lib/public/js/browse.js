function browse_browse(app, type, f) {
  var self = this;
  self.app = app;
  self.type = type;
  self.toString = function(){ return 'Browse '+type; }
  self.url = function() { return self.app.base_url + '/browse/' + type; }
  var schema;
  var bmeta;
  var bmeta_idx;
  var row_height = zcookie.get('row-height-'+type, 40);
  if (f)
    zcookie.set('filters-'+type, f);
  var filters = zcookie.get('filters-'+type, {});
  var page = zcookie.get('page-'+type, 0);
  var pagesize = zcookie.get('pagesize-'+type, 20);
  var order = zcookie.get('order-'+type, null);
  var total = 0;
  var p; // number of fields/90 (for initial cell percent width)

  //
  form_make_listener(self);
  var $el = $$('browser');
  self.$el = function () {
    return $el;
  }

  var $controls = $$('browse-controls');
  self.$controls = function () {
    update_controls();
    return $controls;
  }

  var $info = $$('browse-info');
  self.$info = function () {
    if (bmeta)
      update_info();
    return $info;
  }

  var $filters;
  var $results = $$('results', {parent: $el});
  var $rhead = $$('header', {parent: $results});
  var $rbody = $$('body', {parent: $results});
  var $pager;

  $$ajax(self.app.base_url + '/schema/' + type, null, 'post').done(function (o) {
    schema = o;
    bmeta = o.browser;
    bmeta_idx = {};
    for (var i=0; i<bmeta.length; i++)
      bmeta_idx[bmeta[i].name] = bmeta[i];
    p = Math.floor(100 / bmeta.length) + '%';
    var $r = $$('hrow nowrap');
    for (var i = 0; i < bmeta.length; i++)
      $r.append(create_header_col(bmeta[i]));
    $rhead.append($r);
    request_data();
  });


  function request_data() {
    var d = JSON.stringify({condition: filters, order: order, offset: page * pagesize, limit: pagesize});
    $$ajax(self.app.base_url + '/browse/' + type, d, 'post').done(function (o) {
      $rbody.empty();
      total = o.count;
      update_ui(o.results)
    });
  }

  self.refresh = request_data;


  function update_ui(results) {
    for (var i = 0; i < results.length; i++)
      $rbody.append(create_row(results[i]));
    update_controls();
    update_info();
  }


  function update_controls() {
    $controls.empty();
    $filters = $$('filters', {parent: $controls});
    $pager = $$('pager', {parent: $controls});
    create_pager();
    update_filters();
    return $controls;
  }


  function update_info() {
    create_filter_ui();
    return $info;
  }



  var $lh = null; // last header clicked
  function create_header_col(m) {
    var $e = $$('hcol nowrap');
    $e.css({width: p});
    $e.text(m.name);
    var hilight = function () {
      if (!order)
        return;
      if (order == m.name)
      {
        $e.addClass('order asc');
        $lh = $e;
      }
      else if (order.substring(1) == m.name)
      {
        $e.addClass('order desc');
        $lh = $e;
      }
    }
    hilight();
    $e.click(function () {
      if (order == m.name) {
        order = '-' + m.name;
      }
      else {
        order = m.name;
      }
      zcookie.set('order-'+type, order);
      if ($lh)
        $lh.removeClass('order asc desc');
      hilight();
      $lh = $e;
     request_data();
    });
    return $e;
  }


  function create_row(r) {
    var $r = $$('crow nowrap');
    $r.hover(function () {
        $r.addClass('over');
      },
      function () {
        $r.removeClass('over');
      });
    $r.click(function () {
      self.emit('select', r);
    });
    $r.height(row_height);
    for (var j = 0; j < bmeta.length; j++) {
      var b = bmeta[j];

      var v = get_deep_value(r, b.name);
      var $c = $$('ccol nowrap');
      $c.css({width: p});
      if (b.cell == 'image')
      {
        var u = find_thumb2(r);
        if (u)
          $c.append('<img src="'+u+'">');
      }
      else
        $c.text(v);
      $r.append($c);
    }
    return $r;
  }


/* pager */

  function create_pager()
  {
    $pager.empty();
    $pager.append('<span>'+ total +' total </span>');
    if (total > pagesize) {
      $pager.append(make_page(0, total));
      var pages = Math.floor(total / pagesize) ;
      var n = Math.max(1, page - 5);
      if (n != 1)
        $pager.append('...');
      var b = Math.min(page + 7, pages);
      for (var i = n; i < b; i++)
        $pager.append(make_page(i, total));
      if (b != pages) {
        $pager.append('...');
      }
        $pager.append(make_page(pages, total));

    }

  }

  var $lp = null; // last page clicked
  function make_page(i, total) {
    var $p = $$('page', {el: 'span'});
    if (i == page) {
      $p.addClass('selected');
      $lp = $p;
    }
    var top = Math.min(i*pagesize+pagesize, total);
    $p.text((i*pagesize+1)+'-'+top);
    $p.text(i+1);
    $p.click(function () {
      page = i;
      zcookie.set('page-'+type, page);
      if ($lp)
        $lp.removeClass('selected');
      $lp = $p;
      $lp.addClass('selected');
      request_data();
    });
    return $p;
  }



  /* filters */


  function update_filters() {
    $filters.empty();
    for (var p in filters)
      create_filter_tag(p);
  }

  function create_filter_tag(p) {
    var $e = $$('tag');
    var s = p + ': ';
    for (var q in filters[p])
      s += filters[p][q] + ' ';
    $e.text(s);
    var $a = $("<i class='fa fa-times-circle'></i>");
    $e.append($a);
    $a.click(function () {
      delete filters[p];
      zcookie.set('filters-'+type, filters);
      update_filters();
      request_data();
    });
    $filters.append($e);
  }

  function create_filter_ui() {
    $info.empty();
    var $x = $$('big', {parent: $info});
//      var $apply = $$('btn',{el:'button', parent: $x}).text('apply');
//      var $cancel = $$('btn',{el:'button', parent: $x}).text('cancel');
    $$('heading',{parent: $x}).text('Filters');
    var $filter_rows = $$('filter-rows', {parent: $x});
    var c = 0;
    for (var p in filters) {
      $filter_rows.append(predicate_row(p, filters[p]));
      c++;
    }
    if (c == 0)
      $filter_rows.append(predicate_row());
    $filter_rows.find('input')
    var $add = $$icon('small', {fa: 'plus-circle', parent: $x, label: ' add condition'})
    $add.click(function () {
      $filter_rows.append(predicate_row());
    });
  }

  function get_data_from_ui_and_query()
  {
    page = 0;
    filters = {};
    var c = $info.find('.filter-rows').children();
    console.log(c);
    for (var i=0; i< c.length; i++)
    {
      var $c = $(c[i]);
      var name = $($c.find('.name')).val();
      var cond = $($c.find('.cond')).val();
      var val = $($c.find('input')).val();
      filters[name] = {condition: cond, value: val};
    }
    zcookie.set('filters-'+type, filters);
    zcookie.set('page-'+type, 0);
   //update_filters();
    request_data();
  }


  function predicate_row(p, r)
  {
    var $r = $$('pr');
    var $del = $$icon('del', {fa: 'times-circle', parent: $r});
    $r.append(' ');
    var $s = $$('name', {el:'select', parent: $r});
    for (var i=0; i< bmeta.length; i++)
      $s.append($("<option>"+ bmeta[i].name+"</option>"));
    if (p)
      $s.val(p);
    $r.append('<br>');
    var $t = $$('cond', {el:'select', parent: $r});
    $r.append('<br>');
    var $i = $$('i', {el: 'span', parent: $r});
    $del.click(function(){
      $r.remove();
      get_data_from_ui_and_query();
    });
    $i.keyup(function(k){
      if (k.keyCode == 13)
        get_data_from_ui_and_query();
    });
    $i.change(function(k){
        get_data_from_ui_and_query();
    });
    function update_t_and_i(){
      $t.empty();
      var b = bmeta_idx[$s.val()];
      for (var i=0; i< b.filters.length; i++)
        $t.append($("<option>"+ b.filters[i]+"</option>"));
      $i.empty();
      var $ic = $('<input type="text" class="small">')
      $i.append($ic);
      if (r) {
        $t.val(r.condition);
        $ic.val(r.value);
      }
    }
    $s.change(update_t_and_i);
    update_t_and_i();
    return $r;
  }
}