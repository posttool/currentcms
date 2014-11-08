function slideshow($el, resources, options) {
  var INIT = -1;
  var LOADING = 0;
  var LOADED = 1;
  $el.empty();
  $el.click(next);
//  if (options.$info)
//    options.$info.hide();
  var loading = new Array();
  for (var i=0; i<resources.length; i++)
    loading.push({$img:null, state: INIT});
  var at_idx = options.index ? Math.min(resources.length-1, Math.max(0, Number(options.index))) : 0;

  if (resources.length) {
    goto(at_idx);
    $(window).resize(render);
  }

  return {
    goto: goto,
    get_data: function(){ return imgs; }
  }

  function load(idx) {
    if (loading[idx].state != INIT)
      return;
    console.log("LOADING "+idx);
    loading[idx].state = LOADING;
    var resource = resources[idx];
    var cimg = cimage(resource, function () {
      loading[idx].state = LOADED;
      render();
      load_next();
    });
    var $img = cimg.$el;
    $img.data("resource", resource);
    $img.hide();
    loading[idx].$img = $img;
    $el.append($img);
    cimg.load();
  }

  function is_loading(){
    for (var i=0; i<loading.length; i++)
      if (loading[i].state == LOADING)
        return true;
    return false;
  }

  function get_next_loading_idx(state){
    for (var i=0; i<loading.length; i++)
      if (loading[i].state == state)
        return i;
    return null;
  }

  function is_loaded() {
    for (var i=0; i<loading.length; i++)
      if (loading[i].state != LOADED)
        return false;
    return true;
  }

  function goto(idx){
    console.log("GOTO "+idx);
    if (idx != 0)
      window.location.hash = idx;
    load(idx);
    if (idx != at_idx) {
      // move old one out
      loading[at_idx].$img.fadeOut(100);

//      move(loading[at_idx].$img.get(0))
//        .to(-$(window).width(), 0)
//        .duration(500)
//        .end();
      // new one in
      at_idx = idx;
      loading[at_idx].$img.fadeIn(100);
      loading[at_idx].$img.css({left: $(window).width()})
//      move(loading[at_idx].$img.get(0))
//        .to(0, 0)
//        .duration(500)
//        .end();
    }
    render();
  }

  function load_next() {
    if (is_loading())
      return;
    if (is_loaded())
      return;
    var idx = get_next_loading_idx(INIT);
    load(idx);
  }

  function next() {
    if (at_idx == loading.length - 1) {
      navigate_next();
    }  else {
      goto(at_idx + 1);
    }
  }

  function render() {
    resize();
    var $img = loading[at_idx].$img;
    $img.fadeIn(200);
    update_info($img);
  }

  function update_info($img) {
    if (!options.$info)
      return;
    if (options.infoCallback)
      return options.infoCallback($img.data("resource"));
    options.$info.empty();
    options.$info.html($img.data("resource").description);//todo callback
    var $a = $("<a href='#'>"+(at_idx+1)+" of "+loading.length+"</a>");
    $a.click(next);
    options.$info.append($a);
    var ih = $img.find("img").height();
//    if (ih > 50) {
//      options.$info.css({top: (ih + 10) + 'px', position: 'absolute'});
//      options.$info.fadeIn(150);
//    } else {
//      options.$info.hide();
//    }
  }



  function resize() {
    var $img = loading[at_idx].$img.find("img");
    var w = $(window).width() - options.widthDelta;
    var h = $(window).height() - options.heightDelta;
    var iw = $img.width();
    var ih = $img.height();
    var sx = w / iw;
    var sy = h / ih;
    var sw, sh;
    if (sx < sy) {
      sw = iw * sx;
      sh = ih * sx;
    }
    else {
      sw = iw * sy;
      sh = ih * sy;
    }
    if (options.alignCenter) {
      $img.css({
        position: 'absolute',
        top: (options.yOffset + (h-sh) *.5) +'px',
        left: options.xOffset +'px',
        width: sw+'px',
        height: sh+'px'
      });
    } else {
       $img.css({
        position: 'absolute',
        top: options.yOffset +'px',
        left: options.xOffset +'px',
        width: sw+'px',
        height: sh+'px'
      });
    }
  }

  function cimage(resource, complete) {
    function imgel(sz, cb) {
      var $img = $("<img/>");
      $img_wrap.append($img);
      if (cb)
        $img.load(cb);
      $img.attr("src", bp + "/" + sz + "/" + resource.public_id + ".jpg");
      $img.hide();
      return $img;
    }

    var $img_wrap = $("<div></div>");

    function load() {
      var $img_high;
      var $img_low = imgel("w_120,h_90,c_fit", function () {
        $img_low.show();
        resize();
        $img_high = imgel("w_1200,h_900,c_fit", function () {
          $img_low.remove();
          $img_high.show();
          complete();
        });
      });
    }

  return {$el: $img_wrap, load: load};

}


}


