form_modules["train_ner"] = function (form) {
  var self = this;
  var $el = mixin_basic_component(self, 'train_ner');
  mixin_emitter(self);
  $el.append("<h3>NER Training</h3>");
  $$ajax("/cms/corpus/"+form.id+"/is_trained").done(function(r){
    var $b = $("<button>BUILD</button>")
    var $d = $$('test');
    $el.append($b, "<br><br>", $d);
    confirm_inline($b, 'Really build?', function(){
        var url = form.app.base_url + '/corpus/' + form.id + '/train_ner';
        $$ajax(url).done(function (r) {
          $d.remove();
          $b.show();
          $b.prop('disabled', true);
          $b.text("WORKING...");
        });
      });

    if (r){
      var $a = $("<textarea></textarea>");
      var $t = $("<button>TEST</button>");
      var $r = $("<div></div>").addClass('preview');
      $d.append($a, $t, $r, "<br>");
      $t.click(function(){
        $$ajax("/cms/corpus/"+form.id+"/test/"+encodeURIComponent($a.val())).done(function(r){
          $r.empty();
          $r.append("<br>")
//          for (var i=0; i< r.length; i++) {
//            $r.append("<div><span class='small'>"+r[i].tag+"</span>: <span>"+r[i].text+"</span></div>");
//          }
          for (var t = 0; t < r.tokens.length; t++) {
            var p = false;
            for (var i = 0; i < r.annotations.length; i++) {
              var rr = r.annotations[i];
              var in_range = rr.range.indexOf(t);
              if (in_range == 0) {
                $r.append("<span class='small'>" + rr.tag + "</span><span class='classified'>" + rr.text + "</span><br>");
                p = true;
              } else if (in_range != -1) {
                p = true;
              }
            }
            if (!p)
              $r.append("<span class='none'>" + r.tokens[t] + "</span><br>");
          }

        })
      })
    }
  })


};