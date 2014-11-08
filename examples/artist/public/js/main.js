// menu
$(document).ready(function () {

  // wiring ul elements...

  $("li").click(function (evt) {
    var $el = $(this),
      $ul = $el.next();
    if (is_ul($ul)) {
      select($ul);
      evt.preventDefault();
    }
  });

  $("li").mouseover(function (evt) {
    var $el = $(this),
      $ul = $el.next();
    if (is_ul($ul)) {
      select($ul);
    }
  });

  $("li").mouseout(function (evt) {
    unselect();
  });

  $("ul > ul").mouseover(function () {
    select($(this));
  });

  $("ul > ul").mouseout(function () {
    unselect();
  });

  // ancestor marking

  var $sel_a = $('a[href="' + location.pathname + '"]');
  $sel_a.addClass('selected');
  $sel_a.parent().parent().prev().find('a').addClass('selected');

  // control
  var $sel_ul = null;
  var outid = -1;
  setTimeout(init, 50); // layout doesnt resolve immediately for some reason


  function init() {
    var $ul = $sel_a.parent().parent();
    if (is_ul($ul.parent())) {
      select($ul);
    }
  }

  function is_ul($el) {
    var b = !$el ? false : $el.prop("tagName") == "UL";
    return b;
  }

  function position($ul) {
    if ($ul.prev().length) {
      var li = $ul.prev().position();
      $ul.css({position: "absolute", top: (li.top + 10) + "px", left: li.left + "px"});
    }
  }

  function select($ul) {
    if (outid != -1) {
      clearTimeout(outid);
      outid = -1;
    }
    if ($ul == $sel_ul) {
      return;
    }
    if ($sel_ul) {
      $sel_ul.stop().fadeOut(100);
    }
    $sel_ul = $ul;
    position($sel_ul);
    $sel_ul.stop().fadeIn(200);
  }

  function unselect() {
    if (outid != -1) {
      return;
    }
    outid = setTimeout(function () {
      if ($sel_ul) {
        $sel_ul.stop().fadeOut(500);
        $sel_ul = null;
        outid = -1;
      }
    }, 1000);
  }

});