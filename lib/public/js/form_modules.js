var form_modules = {

  state: function (form) {
    var self = this;
    var $el = mixin_basic_component(self, 'state-panel');
    mixin_emitter(self);
    var stype = {text: 'CHANGE STATE', api: '/status'};
    var st = get_state('transitions', form.state);
    if (!st) {
      stype = {text: 'REQUEST CHANGE', api: '/request_status'};
      st = get_state('requests', form.state);
    }
    self.api = stype.api;

    var selected = -1;
    var $last = $$();
    $el.append('<h3>Status</h3>');
    var $state_is = $("<div class='state-change-choice'><i class='fa fa-check-circle-o'></i> " + get_state_name(form.state) + "</b></div>");
    $state_is.click(function () {
      $last.removeClass('selected');
      $last.find('i').removeClass('fa-check-circle-o');
      $last.find('i').addClass('fa-circle-o');
      selected = -1;
      $last = $$();
      $state_change_ok_btn.prop('disabled', true);
    });
    $el.append($state_is);
    var $state_change_btn = $("<button>" + stype.text + "...</button>");
    $el.append($state_change_btn);
    var $state_change = $$('state-change', {parent: $el}).css({display: 'none'});
    if (st) {
      function add_choice(state) {
        var ss = get_state_name(state);
        var $ssc = $("<div class='state-change-choice'><i class='fa fa-circle-o'></i> " + ss + "</div>");
        $ssc.click(function () {
          selected = state;
          $last.removeClass('selected');
          $last.find('i').removeClass('fa-check-circle-o');
          $last.find('i').addClass('fa-circle-o');
          $ssc.addClass('selected');
          $ssc.find('i').removeClass('fa-circle-o');
          $ssc.find('i').addClass('fa-check-circle-o');
          $last = $ssc;
          $state_change_ok_btn.prop('disabled', false);
        });
        $state_change.append($ssc);
      }

      for (var i = 0; i < st.length; i++)
        add_choice(st[i]);
      var $text = $("<textarea></textarea>");
      $state_change.append($text);
      var $state_change_ok_btn = $("<button>" + stype.text + "</button>").prop('disabled', true);
      var $state_change_cancel_btn = $("<button>CANCEL</button>");
      $state_change.append($state_change_ok_btn, " ", $state_change_cancel_btn);
      $state_change_btn.click(function () {
        $state_change.show();
        $state_change_btn.hide();
      });
      $state_change_cancel_btn.click(function () {
        $state_change.hide();
        $state_change_btn.show();
      });
      $state_change_ok_btn.click(function () {
        self.selected = selected;
        self.text = $text.val();
        self.emit('save', selected);
      });
    }
  },

  ref_delete: function(form){
    var self = this;
    var $el = mixin_basic_component(self, '');
    mixin_emitter(self);
    var $info_rel = $$('related-panel', {parent: $el});
    var $info_del = $$('delete-panel', {parent: $el});
    var c = 0;
    function add_related_btn(type, r) {
      var f = new form_fields.model_field({type:type});
      f.data = r;
      var $m = f.$el();
      $m.dblclick(function () {
        self.emit('select', {type: type, id: r._id});
      });
      $info_rel.append($m);
      c++;
    }
    function add_delete_btn()
    {
      var $delete = $$('delete', {el:'button'}).text('DELETE '+form.type.toUpperCase()+'...');
      $info_del.append($delete);
      confirm_inline($delete, 'Really delete?', function(){
        $delete.hide();
        $$ajax(form.app.base_url + '/delete/'+form.type+'/'+form.id, null, 'post').done(function(r){
          self.emit('close');
        });
      });
    }
    function add_reference_btn() {
      var $delete = $$('delete', {el:'button'}).text('REMOVE REFERENCES');
      $delete.click(function(){
        $$ajax(form.app.base_url + '/delete_references/'+form.type+'/'+form.id, null, 'post').done(function(r){
          form.related = {};
          $info_rel.empty();
          for (var i=0; i< r.length; i++)
            $info_rel.append(r[i]+"<br>");
          $info_del.empty();
          // TODO emit or something! refresh_logs();
          add_delete_btn();
        });
      });
      $info_del.append($delete);
    }
    for (var p in form.related)
      for (var i=0; i<form.related[p].length; i++)
        add_related_btn(p, form.related[p][i]);
    if (form.id)
    {
      if (c == 0)
      {
        add_delete_btn();
        $info_del.prepend("<h3>Careful</h3>");
      }
      else
      {
        add_reference_btn();
        $info_rel.prepend("<h3>References</h3>");
      }
    }
  },

  logs: function (form) {
    var self = this;
    var $info_logs = mixin_basic_component(self, 'logs-panel');
    mixin_emitter(self);
    $info_logs.empty();
    if (form.logs.length != 0) {
      $info_logs.append("<h3>Logs</h3>");
      var $c = $$('logs-panel-c', {parent: $info_logs});
      for (var i = 0; i < form.logs.length; i++)
        $c.append(get_log_row(form.logs[i]));
    }

    function get_log_row(log) {
      var $r = $$('log-row');
      $$('action', {parent: $r}).text(log.action);
      if (log.info.diffs) {
        for (var p in log.info.diffs) {
          $$('diff', {el: 'span', parent: $r}).text(p + ": ");
          log.info.diffs[p].forEach(function (part) {
            var color = part.added ? 'added' :
              part.removed ? 'removed' : 'unchanged';
            $$('diff-' + color, {el: 'span', parent: $r}).text(part.value);
          });
          $r.append('<br clear="both">');
        }
      }
      $$('time', {parent: $r}).html(timeSince(log.time) + " by <i>" + log.user.email + "</i>");
      return $r;
    }
  }
};