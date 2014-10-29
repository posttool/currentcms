// Avoid `console` errors in browsers that lack a console.
(function() {
    var noop = function noop() {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = window.console || {};

    while (length--) {
        // Only stub undefined methods.
        console[methods[length]] = console[methods[length]] || noop;
    }
}());

// Local Storage
var zcookie = {
    exists: (typeof (Storage) !== "undefined" && window['localStorage'] !== null && window['localStorage'] !== undefined)? true: false,
    set: function(key,val){
        if(!this.exists) return null;
        localStorage.setItem( key, JSON.stringify(val) );
        return true;
    },
    get: function(key, default_if_null){
        if(!this.exists) return null;
        var value = localStorage.getItem(key);
        if (!value)
            return default_if_null;
        return value && JSON.parse(value);
    },
    remove: function(key){
        if(!this.exists) return null;
        localStorage.removeItem(key);
        return true;
    },
    destroy: function(){
        if(!this.exists) return null;
        localStorage.clear();
    }
};
//        console.log('window.location.pathname',window.location.pathname)

var obj_to_attr = function(obj){
    var str = ' ';
    for( var p in obj ){
        str += p +'="'+ obj[p] + '" ';
    }
    return str;
}

// Place any jQuery/helper plugins in here.

var $$ = function(className, options)
{
    options = $.extend({
        el: 'div',
        attributes: {},
        css: {},
        parent: null,
        children: [],
        data: {}
    }, options);

     /* Unfortunately, jquery doesn't seem to like to set some attributes as DOM properties. (Notably href for off-DOM objects!!)
        Converting the attributes to a string and making that part of the $el constructor forces jquery to use innerHTML for atts. Yes, slower.
        If there's any problem constructing elements, use the following line:*/
    //  var $el = $( '<'+ options.el + obj_to_attr(options.attributes) +' />' ).css( options.css );
    var $el = $( '<'+ options.el +' />', options.attributes ).css( options.css );

    $el.addClass(className);

    if (options.parent!=null)
        options.parent.append($el);
    for (var i=0; i<options.children.length; i++)
        $el.append(options.children[i]);
    for (var p in options.data)
        $el.attr('data-'+p, options.data[p]);
    return $el;
}


function $$icon(className, options) {
  var $c = $("<span><i class='fa fa-" + options.fa + "'></i></span>");
  if (options.label)
    $c.append(options.label);
  if (options.parent)
    options.parent.append($c);
  if (className)
    $c.addClass(className);
  $c.setfa = function(fa){
    $c.find('i').remove();
    $c.prepend("<i class='fa fa-" +fa + "'></i>")
  };
  return $c;
}

function $$ajax(url,data,type)
{
    return $.ajax({
        crossDomain:false,
        method: type ? type : 'get',
        url: url,
        dataType: "json",
        contentType: "application/json",
        processData: false,
        data: data ? data : ""
    }).fail(function(e){
            console.log("ERROR",e.responseText);
        });
}


function timeSince(date) {

  return moment(date).fromNow();
}


function formatDate(date)
{
  return moment(date).format('MMMM Do YYYY, h:mm:ss a');
}


// modal template
function $$modal(title)
{
    var $el = $$('modal', { css: { display: 'none'} });

    var $head = $$('modal-header',{parent: $el});
    var $btn = $$('close', { el: 'button', parent: $head,
        attributes: { type:'button'}, data: { dismiss: 'modal' }, children: [ $('<span>&times;</span>') ]
    });
    var $h = $$(null,{ el: 'h3',parent: $head, children: [title] });
    var $form = $$('dirty_form', { el: 'form', parent: $el,css: { marginBottom: 0}
    });
    var $body = $$('modal-body', { parent: $form});
    var $foot = $$('modal-footer',{ parent: $form });
    return $el;
}



function get_deep_value(o, p) {
  if (p.indexOf('.') == -1)
    return o[p];
  var ps = p.split('.');
  var oo = o;
  while (ps.length!=0 && oo != null) {
    oo = oo[ps.shift()]
  }
  return oo;
}



// component mixin


function form_make_listener(c) { //todo change to "mixin_emitter"
  if (c.add_listener)
    return;
  var listeners = {};
  var bubbler = null;
  c.add_listener = function (name, callback) {
    if (!listeners[name])
      listeners[name] = [];
    listeners[name].push(callback);
  }
  c.remove_listeners = function (name) {
    listeners[name] = [];
  }
  c.emit = function (name, data) {
    if (bubbler)
      bubbler.emit(name, data);
    else if (listeners[name])
      for (var i = 0; i < listeners[name].length; i++)
        listeners[name][i](c, data);
  }
  c.bubble_listener = function(p){
    bubbler = p;
  }
}
var mixin_emitter = form_make_listener;
function mixin_basic_component(c, cssClassName) {
  var $el = $$(cssClassName).data("__obj__", c);
  c.$el = function () { return $el; };
  return $el;
}


// find a property named 'thumb' within the provided object

function find_thumb(v) {
  var t = find_obj_by_attr(v, 'thumb');
  if (t)
  return t.thumb;
  else return null;
}


function find_obj_by_attr(v, attr, val) {
  if (v == null)
    return null;
  if ($.isPlainObject(v)) {
    var prop = find_prop(v, attr);
    if (prop.found)
      if (val) {
        if (prop.value == val)
          return v;
      }
      else
        return v;
    for (var p in v) {
      var f = find_obj_by_attr(v[p], attr, val);
      if (f)
        return f;
    }
  } else if ($.isArray(v)) {
    for (var i = 0; i < v.length; i++) {
      var f = find_obj_by_attr(v[i], attr, val);
      if (f)
        return f;
    }
  } else {
    return null;
  }
}

function find_prop(v, p){
  var ps = p.split('.');
  var t = v;
  for (var i=0; i<ps.length; i++) {
    if (!t[ps[i]])
      return {found: false, at: ps[i]};
    t = t[ps[i]];
  }
  return {found: true, value: t};
}

function find_thumb2(c){
  var f = find_obj_by_attr(c, 'meta.job_name', 'image thumb');
  if (f)
    return media_path(f);
  //
  f = find_obj_by_attr(c, 'meta.public_id');
  if (f) {
    var x = f.meta.url.indexOf(f.meta.public_id);
    var bp = f.meta.url.substring(0, x - 1);
    x = bp.lastIndexOf('/');
    bp = bp.substring(0, x);
    var s = bp +  "/w_206,h_106,c_fill/" +f.meta.public_id + ".jpg";
    return s;
  }
  return null;
}

function media_path(resource)
{
  if (!resource)
    return null;
  if (typeof resource == "string")
    return resource;
  if (containerHttp)
    return containerHttp + resource.path;
  else
    return download_url + '/' + resource._id
}



function confirm_inline($el, message, next) {
  var $p = $$('p');
  var $n = $$('x', {el:'span'}).text(message+' ');
  var $b = $$('x', {el:'button'}).text('OK');
  var $c = $$('x', {el:'button'}).text('CANCEL');
  $p.append($n,$b,$c);
  $el.after($p);
  $p.hide();
  $el.click(function(){
    $el.hide();
    $p.show();
  });
  $b.click(function(){
    $p.hide();
    next();
  });
  $c.click(function(){
    $el.show();
    $p.hide();
  });
}




/// functions that rely on global __templates, __states, __transitions

function render_template(type, object) {
  try {
    return new EJS({text: __templates[type]}).render(object);
  } catch (e) {
    console.error(e);
    return "";
  }
}

function get_state_name(code) {
  if (!__workflow[code])
    return code;
  return __workflow[code].name;
}

function get_state(type, code) {
  if (!__workflow[type])
    return null;
  for (var i = 0; i < __workflow[type].length; i++)
    if (__workflow[type][i].from == code)
      return __workflow[type][i].to;
  return null;
}


/// random stylin'

function bg_w_grad($el, url){
  var c = '230,230,230';//'231,229,224';
  var s = 'linear-gradient(-90deg, rgba('+c+',1) 10%, rgba('+c+',.55) 70%, rgba('+c+',0) 90%, rgba('+c+',0) 100%)';
  $el.css({'background-image': vendor_prefix.css+s+'', 'background-repeat':'no-repeat'}); //, url('+url+')
}
//http://davidwalsh.name/vendor-prefix
var vendor_prefix = (function () {
  var styles = window.getComputedStyle(document.documentElement, ''),
    pre = (Array.prototype.slice
      .call(styles)
      .join('')
      .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
    )[1],
    dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
  return {
    dom: dom,
    lowercase: pre,
    css: '-' + pre + '-',
    js: pre[0].toUpperCase() + pre.substr(1)
  };
})();