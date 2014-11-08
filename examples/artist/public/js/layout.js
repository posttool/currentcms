function layout($el, list) {

  list.shuffle();

  var imgs = [];
  var load_idx = 0;

  function load(resource) {
    var $img = $("<img/>");
    $img.load(function () {
      $img.fadeIn(400);
      render();
      load_idx++;
      load_next();
    });
    $img.error(function(){
      load_idx++;
      load_next();
    })
    $img.hide();
    $img.attr("src", bp + "/h_150,c_fit/" + resource.public_id + ".jpg");
    $img.click(function(){
      location.href = resource.source.url + "#" +resource.source.index;
    });
    imgs.push($img);
    $el.append($img);
  }

  function load_next() {
    if (load_idx == list.length) {
      //comspl
    } else {
      load(list[load_idx]);
    }
  }

  function render() {
    var x = 0;
    var y = 0;
    for (var i=0; i<imgs.length; i++) {
      var $img = imgs[i];
      $img.css({position: "absolute", top: y+"px", left: x+"px"});
      x += $img.width() + 20;
      if (x > $(window).width()) {
        x = 0;
        y += 170;
      }
    }
  }

  if (list.length) {
    load_next();
    $(window).resize(render);
  }
}