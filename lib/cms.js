/**
 * Module dependencies
 */
var EventEmitter = require('events').EventEmitter,
    fs = require('fs'),
    uuid = require('node-uuid'),
    mime = require('mime'),
    mongoose = require('mongoose'),
    gfs, Grid = require('gridfs-stream'),
    express = require('express'),
    MongoStore = require('connect-mongo')(express),
    formidable = require('formidable'),
    kue = require('kue'),
    auth = require('./auth'),
    meta = require('./meta'),
    guard = require('./guard'),
    workflow = require('./workflow'),
    utils = require('./utils'),
    models = require('./models'),
    logger = utils.get_logger('cms');



exports.Cms = Cms;


/**
 * Construct the Cms with a module. Cms ready modules must export at least `models` and `config`.
 * @constructor
 */
function Cms(module) {
  if (!module)
    throw new Error('Requires a module');
  if (!module.config)
    throw new Error('Module requires config');
  if (!module.config.name)
    logger.info('No name specified in config. Calling it null.')
  if (!module.config.mongoConnectString)
    throw new Error('Config requires mongoConnectString');
  if (!module.models)
    throw new Error('Module requires models');
  // module info and shortcut to configuration
  this.module = module;
  this.config = module.config;
  // connection to mongo
  this.connection = null;
  // the storage client
  this.client = null;
  // gridfs storage (untested)
  this.gfs = null;
  // the express app
  this.app = null;
  // login, logout
  this.auth = null;
  // meta info for models
  this.meta = null;
  // guard manages view permissions
  this.guard = null;
  // workflow provides state transition info to view
  this.workflow = null;

  logger.info('cms init');
  //process.nextTick(this._init.bind(this));
  this._init();
}


Cms.prototype.__proto__ = EventEmitter.prototype;


Cms.prototype._init = function () {
  var self = this;

  // mongoose connection
  self.connection = mongoose.createConnection(self.config.mongoConnectString);
  self.connection.on('error', function(e){
    logger.error('connection error');
    logger.error(e);
    self.emit('error', {type: 'connection error', exception: e});
  });
  logger.info('cms connected to db...');

  // model helper
  self.meta = new meta.Meta(self.module.models, self.connection);
  self.auth = new auth.Auth(self.meta, '/cms');
  self.guard = new guard.Guard(self.module.permissions);
  self.workflow = new workflow.Workflow(self.module.workflow);

  // queued jobs, like resizing and transcoding
  if (self.config.kueConfig) {
    self.jobs = kue.createQueue(self.config.kueConfig);
    self.jobs.on('job complete', self.job_complete.bind(self));
    logger.info('cms established kue')
  }

  // storage for servable stuff
  switch (self.config.storage) {
    case "pkgcloud":
      self.client = require('pkgcloud').storage.createClient(self.config.pkgcloudConfig);
      logger.info('cms established storage ['+self.config.pkgcloudConfig.provider+'/'+self.config.pkgcloudConfig.username+']');
      break
    case "cloudinary":
      self.cloudinary = require('cloudinary');
      self.cloudinary.config(self.config.cloudinaryConfig);
      logger.info('cms established cloudinary '+self.config.cloudinaryConfig.cloud_name);
      break
    case "gfs":
      self.gfs = new Grid(self.connection.db);
      logger.info('cms initialized gfs storage');
      break;
    default:
      break;
  }

  // the express app
  var app = self.app = express();
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');
  app.use(express.static(__dirname + '/public'));
  app.use(express.cookieParser());
  app.use(express.session({
    secret: self.config.sessionSecret,
    store: new MongoStore({db: self.connection.db})
  }));
  app.use(express.urlencoded());
  app.use(express.json());
  app.use(express.methodOverride());

  // move session message to request locals
  // put user & http base path in request locals
  app.use(function (req, res, next) {
    res.locals.message = req.session.message;
    delete req.session.message;
    res.locals.user = req.session.user;
    res.user = req.session.user;
    res.locals.containerHttp = self.config.containerHttp;
    next();
  });

  // get ready for routing by defining middleware

  // check for user in session
  var middle1 = [auth.has_user,
      self.add_workflow.bind(self)];

  // add meta info to the request and verify that user has permission
  var middle2 = [auth.has_user,
    self.add_workflow.bind(self),
    self.add_meta.bind(self)];
  var middle2b = [auth.has_user,
    self.add_workflow.bind(self),
    self.add_meta.bind(self),
    self.permission_browse.bind(self)];
  var middle2f = [auth.has_user,
    self.add_workflow.bind(self),
    self.add_meta.bind(self),
    self.permission_form.bind(self)];

  // add meta info and object
  var middle3 = [auth.has_user,
    self.add_workflow.bind(self),
    self.add_meta.bind(self),
    self.add_object.bind(self),
    self.permission_object.bind(self)];

  // route
  app.get('/login',
    self.auth.login_get.bind(self.auth));
  app.post('/login',
    self.auth.login_post.bind(self.auth));
  app.all('/logout',
    self.auth.logout.bind(self.auth));
  app.get('/profile',
    auth.has_user, self.auth.profile_get.bind(self.auth));
  app.post('/profile',
    auth.has_user, self.auth.profile_post.bind(self.auth));

  app.all('/cms',
    middle2, self.show_dashboard.bind(self));
  app.all('/cms/logs',
    middle1, self.logs_for_user.bind(self));
  app.all('/cms/logs/:type/:id',
    middle2, self.logs_for_record.bind(self));
  app.get('/cms/browse/:type',
    middle2b, self.browse_get.bind(self));
  app.post('/cms/browse/:type',
    middle2b, self.browse_post.bind(self));
  app.post('/cms/schema/:type',
    middle2b, self.browse_schema.bind(self));
  app.get('/cms/create/:type',
    middle2f, self.form_get.bind(self));
  app.post('/cms/create/:type',
    middle2f, self.form_post.bind(self));
  app.get('/cms/update/:type/:id',
    middle2f, self.form_get.bind(self));
  app.post('/cms/update/:type/:id',
    middle3, self.form_post.bind(self));
  app.get('/cms/get/:type',
    middle2f, self.form_get_json.bind(self));
  app.get('/cms/get/:type/:id',
    middle3, self.form_get_json.bind(self));
  app.post('/cms/delete_references/:type/:id',
    middle3, self.form_delete_references.bind(self));
  app.post('/cms/delete/:type/:id',
    middle3, self.form_delete.bind(self));
  app.post('/cms/status/:type/:id',
    middle3, self.form_status.bind(self));
  app.post('/cms/requests/:state',
    middle3, self.requests_for_state.bind(self));
  app.post('/cms/requests/:type/:id',
    middle3, self.request_for_record.bind(self));
  app.post('/cms/request_status/:type/:id',
    middle3, self.form_request_status.bind(self));
  app.post('/cms/upload',
    middle1, self.resource_upload.bind(self));
  app.get('/cms/download/:id',
    middle1, self.resource_download.bind(self));
  app.get('/cms/delete_resource/:id',
    middle1, self.resource_delete.bind(self));

  logger.info('cms ready ['+self.config.name+']');
  self.emit('ready');
}



// add workflow info to request
Cms.prototype.add_workflow = function (req, res, next) {
  req.workflow = res.locals.workflow = this.workflow.get_info(req.session.user);
  next();
};


// for requests that contain :type ... put the meta info in the request
Cms.prototype.add_meta = function (req, res, next) {
  var user = req.session.user;
  var type = req.params.type;
  req.form_modules = [];
  if (user.admin)
  {
    req.models = res.locals.models = this.guard.get_admin_models(this.meta);
    req.form_includes = this.meta.jsIncludes();
    if (type) {
      req.type = type;
      req.schema = this.meta.schema(type);
      req.model = this.meta.model(type);
      req.browse = this.meta.browse(type);
      req.form = utils.expand_functions(this, this.meta.form(type));
      req.form_modules = this.meta.formModules(type);
    }
  }
  else
  {
    req.models = res.locals.models = this.guard.get_models(req.session.user, this.meta);
    req.form_includes = this.meta.jsIncludes();
    if (type) {
      req.type = type;
      req.schema = this.meta.schema(type);
      req.model = this.meta.model(type);
      if (this.guard.can_browse(user, type))
      {
        var browse_type = this.guard.browse_type(user, type);
        req.browse = this.meta.browse(type, browse_type);
        var browse_conditions = this.guard.browse_conditions(user, type);
        if (browse_conditions)
          req.browse_conditions = browse_conditions(user);
      }
      if (this.guard.can_edit(user, type))
      {
        var form_type = this.guard.form_type(user, type);
        req.form = utils.expand_functions(this, this.meta.form(type, form_type));
        req.form_permission = this.guard.form_permission(user, type);
        req.form_create = this.guard.can_create(type, form_type);
        req.form_delete = this.guard.can_delete(type, form_type);
        req.form_modules = this.meta.formModules(type); // need to add subtype stuff
      }
    }
  }

  next();
};


// find and populate a "deep" view of the model as well as all "related" entities
Cms.prototype.add_object = function (req, res, next) {
  var meta = this.meta;
  if (!req.params.id) {
    next();
    return;
  }
  meta.expand(req.type, req.params.id, function (err, m) {
    if (err) {
      next(err);
      return;
    }
    req.object = m;
    if (m)
      meta.related(req.type, m._id, function (r) {
        req.related = r;
        req.related_count = r._count;
        delete r._count;
        next();
      });
    else
      next();
  });
};


//
Cms.prototype.permission_object = function (req, res, next) {
  if (req.form_permission)
    req.form_permission(req.session.user, req.object, next);
  else
    next();
}

Cms.prototype.permission_browse = function (req, res, next) {
  if (req.browse)
    next();
  else
    next('permission error');
}

Cms.prototype.permission_form = function (req, res, next) {
  if (req.form)
    next();
  else
    next('permission error');
}



// the "dashboard"
Cms.prototype.show_dashboard = function (req, res) {
  var title = this.config.name;
  res.render('cms/dashboard', {
    title: title,
    models: req.models,
    jsIncludes: req.form_includes
  });
};


// browse
Cms.prototype.browse_get = function (req, res) {
  var conditions = utils.process_browse_filter(req.body.condition);
  if (req.browse_conditions)
    for (var p in req.browse_conditions)
      conditions[p] = req.browse_conditions[p];
  req.model.count(conditions, function (err, count) {
    res.render('cms/browse', {
      title: 'CMS Dashboard ',
      browser: req.browse,
      type: req.type,
      total: count,
      jsIncludes: req.form_includes
    });
  });
};


// browse (json): returns filters, ordered, offset results
Cms.prototype.browse_post = function (req, res) {
  var conditions = utils.process_browse_filter(req.body.condition);
  if (req.browse_conditions)
    for (var p in req.browse_conditions)
      conditions[p] = req.browse_conditions[p];
  var fields = null; // get from req.browse_fields!
  var options = {sort: req.body.order, skip: req.body.offset, limit: req.body.limit};
  req.model.count(conditions, function (err, count) {
    var q = req.model.find(conditions, fields, options);
    var refs = meta.get_references(req.schema);
    if (refs)
      q.populate(meta.get_names(refs).join(" "));
    q.exec(function (err, r) {
      res.json({results: r, count: count});
    });
  });
};


// browse (json): get 'browser' info and our simplified schema info
Cms.prototype.browse_schema = function (req, res) {
  res.json({schema: meta.get_schema_info(req.schema), browser: req.browse});
};


// form: create/update
Cms.prototype.form_get = function (req, res) {
  res.render('cms/form', {
    title: (req.object ? 'Editing' : 'Creating') + ' ' + req.type,
    type: req.type,
    id: req.id ? req.id : null,
    form: req.form,
    modules: req.form_modules,
    jsIncludes: req.form_includes
  });
};


// form (json): get the object, related objects as well as form meta info
Cms.prototype.form_get_json = function (req, res) {
  var object = req.object || new req.model();

  var meta_meta = this.meta.meta(req.type);
  var related = {};
  if (meta_meta.references != 'manual')
    for (var p in req.related)
      related[p] = req.related[p].results;
  res.json({
    title: (req.object ? 'Editing' : 'Creating') + ' ' + req.type,
    type: req.type,
    object: object,
    related: related,
    modules: req.form_modules,
    form: req.form});
};


// form (json): save
Cms.prototype.form_post = function (req, res) {
  var self = this;
  var object = req.object || new req.model();
  var data = JSON.parse(req.body.val);
  var schema_info = meta.get_schema_info(req.schema);

  var presave = self.meta.info[req.type].presave;
  if (!presave)
    presave = function(object, data, next){
      next();
    };
  presave(object, data, function(){
    // get info about differences and set values
    var info = utils.get_diffs(req.form, schema_info, data, object);
    for (var p in data)
      object[p] = data[p];

    // set the creator (if unset)
    if (!object.creator)
      object.creator = req.session.user._id;

    // set the default state (if unset)
    var workflow = self.module.workflow;
    if (!object.state && workflow && workflow.default)
      object.state = workflow.default;

    //self.emit('pre save', object);
    object.save(function (err, s) {
      if (err)
      {
        logger.error(err);
        res.json({error: err});
        return;
      }
      self.add_log(req.session.user._id, 'save', req.type, s, info, function () {
        self.meta.expand(req.type, s._id, function (err, s) {
          res.json(s);
        });
      });
    });
  });
};


// form (json): delete references
Cms.prototype.form_delete_references = function (req, res) {
  var self = this;

  if (req.related_count == 0)
    res.json({});
  else {
    var to_update = [];
    for (var p in req.related) {
      if (req.related[p].results.length == 0)
        continue;
      var f = req.related[p].field;
      var o = {};
      o[f.name] = req.object._id;
      to_update.push({o: o, p: p});
    }
    var info = [];
    utils.forEach(to_update, function (e, n) {
      self.meta.model(e.p).update(e.o, {$pull: e.o}, { multi: true }, function (err, x) {
        info.push('Removed ' + x + ' reference(s) from ' + e.p + ".");
        n();
      });
    }, function () {
      self.add_log(req.session.user._id, 'remove references', req.type, req.object, {messages: info}, function () {
        res.json(info);
      });
    })
  }
};


// form (json): delete
Cms.prototype.form_delete = function (req, res) {
  var self = this;
  var remove_obj = function(){
    req.object.remove(function (err, m) {
      res.json(m);
    });
  };
  if (req.model == self.meta.Resource) {
    self.delete_resource(req.object._id, remove_obj);
  } else {
    remove_obj();
  }
};


// form (json): workflow state
Cms.prototype.form_status = function (req, res, next) {
  var self = this;
  var new_state = req.body.state;
  var original_state = req.object.state;
  var ok = self.workflow.can_update(req.session.user, req.type, original_state, new_state);
  if (!ok) {
    next('workflow error');
    return;
  }
  req.object.state = new_state;
  req.object.save(function (err, m) {
    self.add_log(req.session.user._id, 'change status', req.type, m,
      {message: 'From ' + original_state + 'to ' + req.object.state, reason: req.body.reason}, function (info) {
        // todo find open related requests - notify requestors & close requests
        res.json(info);
      });
  });
};


Cms.prototype.form_request_status = function (req, res, next) {
  var self = this;
  var new_state = req.body.state;
  var original_state = req.object.state;
  var ok = self.workflow.can_request(req.session.user, req.type, original_state, new_state);
  if (!ok) {
    next('workflow error');
    return;
  }
  req.object.state = new_state;
  var Request = self.meta.Request;
  Request.findOne({'obj.t': req.type, 'obj.i': req.params.id, complete: false}, function (err, r) {
    if (r){
      next('request already exists');
      return;
    }
    else
    {
      var r = new Request({
        obj: {t: req.type, i: req.object._id},
        state: new_state,
        request_message: req.body.reason
      });
      r.save(function(err, r){
        res.json(r);
      });
    }
  });
};


Cms.prototype.request_for_record = function(req, res) {
   this.meta.Request.findOne({'obj.t': req.type, 'obj.i': req.params.id, complete: false}, function (err, r) {
      res.json({request: r});
   });
}


Cms.prototype.requests_for_state = function(req, res) {
  var meta = this.meta;
   meta.Request.find({state: req.params.state, complete: false}, function (err, reqs) {
    utils.forEach(reqs, function (r, n) {
      meta.model(r.obj.t).findOne({_id: r.obj.i}, function (err, o) {
        if (!r.info)
          r.info = {};
        r.info.object = o;
        n();
      });
    }, function () {
      res.json({request: reqs});
    });
   });
}


// logs
Cms.prototype.logs_for_user = function (req, res) {
  this.get_logs({user: req.session.user._id}, {sort: '-time'}, function (logs) {
    res.json(logs);
  });
};


Cms.prototype.logs_for_record = function (req, res) {
  this.get_logs({'obj.t': req.params.type, 'obj.i': req.params.id }, {sort: '-time'}, function (logs) {
    res.json(logs);
  });
};


Cms.prototype.get_logs = function (query, options, complete) {
  var meta = this.meta;
  var Log = meta.Log;
  var q = Log.find(query, null, options);
  q.populate('user', 'name email');
  q.exec(function (err, logs) {
    utils.forEach(logs, function (log, n) {
      try {
        meta.model(log.obj.t).findOne({_id: log.obj.i}, function (err, o) {
          if (!log.info)
            log.info = {};
          log.info.object = o;
          n();
        });
      } catch (e) {
        n();
      }
    }, function () {
      complete(logs);
    });
  });
}


Cms.prototype.add_log = function (user_id, action, type, instance, info, callback) {
  var Log = this.meta.Log;
  var log = new Log({
      user: user_id,
      action: action,
      info: info,
      obj: {t: type, i: instance._id}
    }
  );
  console.log(log);
  log.save(function (err, l) {
    console.log(l);
    callback(l);
  });
}


//  resource handling


Cms.prototype.save_resource = function (name, path, mimetype, size, creator_id, info, next) {
  var self = this;
  var meta = self.meta;
  var r = new meta.Resource();
  r.name = name;
  r.mime = mimetype ? mimetype : mime.lookup(name);
  r.path = path;
  r.size = size;
  r.creator = creator_id;
  r.meta = info ? info : {};
  if (info && info.title)
    r.title = info.title;
  if (info && info.subtitle)
    r.subtitle = info.subtitle;
  if (info && info.description)
    r.description = info.description;
  //self.emit('resource pre save');
  r.save(function (err, s) {
    if (err) throw err;
    //self.emit('resource post save');
    var resource_jobs = meta.meta().Resource.jobs;
    if (resource_jobs) {
      if (!self.jobs) {
        logger.warn('there is no available job kue... not executing ' + resource_jobs);
        return;
      }
      var type = r.mime.split('/')[0];
      if (resource_jobs[r.mime])
        resource_jobs = resource_jobs[r.mime];
      else
        resource_jobs = resource_jobs[type];
      if (resource_jobs)
        for (var i = 0; i < resource_jobs.length; i++) {
          var process = resource_jobs[i];
          var job_name = type + ' ' + process;
          console.log("job create", job_name);
          self.jobs.create(job_name, {
            container: self.config.container,
            filename: path,
            parent: r._id,
            creator: creator_id}).save();
        }
    }
    next(s);
  });
  return r;
}


Cms.prototype.job_complete = function (id) {
  var meta = this.meta;
  logger.info('job complete', id);
  kue.Job.get(id, function (err, job) {
    if (err || !job) {
      logger.error(err);
      return;
    }
    job.get('path', function (err, p) {
      job.get('size', function (err, s) {
        logger.info('  params', p, s);
        meta.Resource.findOne({_id: job.data.parent}, null, function (err, r) {
          if (err) throw err;
          var pr = {};
          pr.mime = p ? mime.lookup(p) : null;
          pr.path = p;
          pr.size = s;
          pr.meta = {generated: true, job_name: job.type};
          meta.Resource.update({_id: job.data.parent}, {$push: {children: pr}}, function (err, r) {
            if (err) throw err;
            logger.info('removing job');
            job.remove();
          });
        });
      });
    });
  });
};


client_upload_params = function (config, path) {
  return {container: config.container,
    remote: path,
    headers: {
      'content-disposition': mime.lookup(path)
    }}
};


Cms.prototype.resource_upload = function (req, res) {
  var self = this;
  var form = new formidable.IncomingForm();
  form.onPart = function (part) {
    if (!part.filename) {
      form.handlePart(part);
      return;
    }
    var path = uuid.v4() + '/' + part.filename;
    self.write(part, path, function (meta) {
      self.save_resource(part.filename, path, part.mime, form.bytesReceived, req.session.user._id, meta, function (s) {
        res.json(s);
      });
    });
  }
  form.parse(req, function () {});
};


Cms.prototype.write = function (stream, path, next) {
  var self = this;

  var n2 = function(err){
    if (err) console.error(err);
    return next(err);
  }
//  stream.on('error', function (e) {
//    n2(e);
//  });

  switch (self.config.storage) {
    case "file":
      new Error('unimplemented');
      break;
    case "pkgcloud":
      var o = client_upload_params(self.config, path);
      stream.pipe(self.client.upload(o, n2));
      break;
    case "cloudinary":
      var cloudStream = self.cloudinary.uploader.upload_stream(n2);
      stream.on('data', cloudStream.write).on('end', cloudStream.end);
      break;
    case "gfs":
      // untested
      var ws = self.gfs.createWriteStream({ filename: path });
      stream.pipe(ws);
      stream.on('end', n2);
      //ws.on('error', function (e) {
      //  n2(e);
      //});
      break;
  }
}


Cms.prototype.resource_delete = function (req, res, next) {
  var self = this;
  self.delete_resource(req.params.id, function(err, r) {
    if (err) return next(err);
    res.json(r);
  });
};

Cms.prototype.delete_resource = function (id, complete) {
  var self = this;
  var Resource = self.meta.Resource;
  var q = Resource.findOne({_id: id});
  q.exec(function (err, r) {
    if (err) return complete(err);
    if (r) {
      switch (self.config.storage) {
        case "pkgcloud":
          self.client.removeFile(config.container, r.path, function (err) {
            if (err) return complete(err);
            r.remove(function (err, r) {
              if (err) return complete(err);
              logger.info('resource ' + JSON.stringify(r) + ' deleted')
              complete(null, {message: 'Resource deleted'});
            });
          });
          break
        case "cloudinary":
          self.cloudinary.uploader.destroy(r.meta.public_id, function (result) {
            complete(null, result);
          });
          break
        case "gfs":
        default:
          break;
      }
    }
    else {
      complete('ERR no such resource '+id);
    }
  });
};


Cms.prototype.resource_download = function (req, res) {
  var self = this;
  var Resource = self.meta.Resource;
  var q = Resource.findOne({_id: req.params.id});
  q.exec(function (err, r) {
    if (r) {
      switch (self.config.storage) {
        case "pkgcloud":
          break
        case "cloudinary":
          break
        case "gfs":
        default:
          res.setHeader('Content-Type', r.mime + (r.charset ? '; charset=' + r.charset : ''));
          res.setHeader('Content-Disposition', 'attachment; filename=' + r.path);
          gfs
            .createReadStream({ _id: r._id })
            .pipe(res);
          break;
      }
    }
    else {
      res.send('ERR');
    }
  });
};
