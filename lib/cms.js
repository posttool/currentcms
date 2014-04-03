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
    Meta = require('./meta'),
    utils = require('./utils'),
    models = require('./models'),
    logger = utils.get_logger('cms');


/**
 * The Cms class is the only export.
 * @type {Cms}
 */
exports = module.exports = Cms;


/**
 * Construct the Cms with a module. Cms ready modules must export at least `models` and `config`.
 * @constructor
 */
function Cms(module) {
  if (!module)
    throw new Error('Requires a module');
  if (!module.name)
    logger.info('No name specified for module. Calling it null.')
  if (!module.config)
    throw new Error('Module requires config');
  if (!module.config.mongoConnectString)
    throw new Error('Config requires mongoConnectString');
  if (!module.models)
    throw new Error('Module requires models');
  this.module = module;
  this.config = module.config;
  this.connection = null;
  this.meta = null;
  this.client = null;
  this.gfs = null;
  this.app = null;
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

  // model helper
  self.meta = new Meta(self.module.models, self.connection);

  // user management
  self.auth = new auth.Auth(self.meta, '/cms');

  // queued jobs, like resizing and transcoding
  if (self.config.kueConfig) {
    self.jobs = kue.createQueue(self.config.kueConfig);
    self.jobs.on('job complete', self.job_complete.bind(self));
    logger.info('initialed process queue')
  }

  // storage for servable stuff
  switch (self.config.storage) {
    case "pkgcloud":
      self.client = require('pkgcloud').storage.createClient(self.config.pkgcloudConfig);
      logger.info('created pkgcloud storage client');
      break
    case "cloudinary":
      self.cloudinary = require('cloudinary');
      self.cloudinary.config(self.config.cloudinaryConfig);
      logger.info('initialized cloudinary api');
      break
    case "gfs":
    default:
      self.gfs = new Grid(self.connection.db);
      logger.info('initialized gfs storage');
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
  var aspect1 = [auth.has_user,
      self.add_workflow.bind(self)];

  // add meta info to the request and verify that user has permission
  var aspect2 = [auth.has_user,
    self.add_workflow.bind(self),
    self.add_meta.bind(self),
    self.permission_type.bind(self)];

  // add meta info and object
  var aspect3 = [auth.has_user,
    self.add_workflow.bind(self),
    self.add_meta.bind(self),
    self.permission_type.bind(self),
    self.add_object.bind(self),
    self.permission_object.bind(self)];

  // route
  self.auth.init(app);

  app.all('/cms',
    aspect2, self.show_dashboard.bind(self));
  app.all('/cms/logs',
    aspect1, self.logs_for_user.bind(self));
  app.all('/cms/logs/:type/:id',
    aspect2, self.logs_for_record.bind(self));
  app.get('/cms/browse/:type',
    aspect2, self.browse_get.bind(self));
  app.post('/cms/browse/:type',
    aspect2, self.browse_post.bind(self));
  app.post('/cms/schema/:type',
    aspect2, self.browse_schema.bind(self));
  app.get('/cms/create/:type',
    aspect2, self.form_get.bind(self));
  app.post('/cms/create/:type',
    aspect2, self.form_post.bind(self));
  app.get('/cms/update/:type/:id',
    aspect2, self.form_get.bind(self));
  app.post('/cms/update/:type/:id',
    aspect3, self.form_post.bind(self));
  app.get('/cms/get/:type',
    aspect2, self.form_get_json.bind(self));
  app.get('/cms/get/:type/:id',
    aspect3, self.form_get_json.bind(self));
  app.post('/cms/delete_references/:type/:id',
    aspect3, self.form_delete_references.bind(self));
  app.post('/cms/delete/:type/:id',
    aspect3, self.form_delete.bind(self));
  app.post('/cms/status/:type/:id',
    aspect3, self.form_status.bind(self));
  app.post('/cms/upload',
    aspect1, self.upload.bind(self));
  app.get('/cms/download/:id',
    aspect1, self.download.bind(self));
  app.get('/cms/delete_resource/:id',
    aspect1, self.delete_resource.bind(self));

  logger.info('current cms 0.1.13');
}


Cms.prototype.permission_type = function (req, res, next) {
  next();
}


Cms.prototype.permission_object = function (req, res, next) {
  if (req.form_permission)
    req.form_permission(req.session.user, req.object, next);
  else
    next();
}


// add workflow info to request
Cms.prototype.add_workflow = function (req, res, next) {
  var workflow = this.module.workflow;
  if (workflow) {
    var group = req.session.user.group;
    if (req.session.user.admin)
      group = workflow.groups.admin;
    req.workflow = res.locals.workflow = {states: workflow.states, transitions: workflow.groups[group].transitions};
  }
  else {
    req.workflow = res.locals.workflow = null;
  }
  next();
};


// for requests that contain :type ... put the meta info in the request
Cms.prototype.add_meta = function (req, res, next) {
  var user = req.session.user;
  var models = {};
  var browses = {};
  var forms = {};
  var permissions = {};
  var conditions = {};
  var all_models = this.meta.meta();
  var perm = this.module.permission;
  if (perm && user.group && !user.admin && perm[user.group]) {
    var form = perm[user.group].form;
    if (form)
      for (var i=0; i<form.length; i++) {
        var o = form[i];
        if (typeof(o) == 'string')
        {
          models[o] = all_models[o];
        }
        else
        {
          models[o.name] = all_models[o.name];
          forms[o.name] = o.form;
          permissions[o.name] = o.permission;
        }
      }
    var browse = perm[user.group].browse;
    if (browse)
      for (var i=0; i<browse.length; i++) {
        var o = browse[i];
        if (typeof(o) == 'string')
        {
          models[o] = all_models[o];
        }
        else
        {
          models[o.name] = all_models[o.name];
          browses[o.name] = o.browse;
          conditions[o.name] = o.conditions;
        }
      }
  }
  else
    models = all_models;
  req.models = res.locals.models = models;

  var type = req.params.type;
  if (type && models[type]) {
    req.type = type;
    req.schema = this.meta.schema(type);
    req.model = this.meta.model(type);
    req.browser = this.meta.browse(type, browses[type]);
    req.browse_conditions = conditions[type] ? conditions[type](user) : null;
    req.form = this.meta.form(type, forms[type]);
    req.form_permission = permissions[type];
  }
  next();
};


/* find and populate a "deep" view of the model as well as all "related" entities
 * the put it in the request */
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


// the "dashboard"
Cms.prototype.show_dashboard = function (req, res) {
  var title = this.config.name;
  res.render('cms/dashboard', {
    title: title,
    models: req.models
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
      browser: req.browser,
      type: req.type,
      total: count
    });
  });
};


// browse (json): returns filters, ordered, offset results
Cms.prototype.browse_post = function (req, res) {
  var conditions = utils.process_browse_filter(req.body.condition);
  if (req.browse_conditions)
    for (var p in req.browse_conditions)
      conditions[p] = req.browse_conditions[p];
  //console.log(conditions)
  var fields = null; // get from req.browse_fields!
  var options = {sort: req.body.order, skip: req.body.offset, limit: req.body.limit};
  req.model.count(conditions, function (err, count) {
    var q = req.model.find(conditions, fields, options);
    var refs = utils.get_references(req.schema);
    if (refs)
      q.populate(utils.get_names(refs).join(" "));
    q.exec(function (err, r) {
      res.json({results: r, count: count});
    });
  });
};


// browse (json): get 'browser' info and our simplified schema info
Cms.prototype.browse_schema = function (req, res) {
  res.json({schema: utils.get_schema_info(req.schema), browser: req.browser});
};


// form: create/update
Cms.prototype.form_get = function (req, res) {
  res.render('cms/form', {
    title: (req.object ? 'Editing' : 'Creating') + ' ' + req.type,
    type: req.type,
    id: req.id ? req.id : null,
    form: req.form});
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
    form: req.form})
};


// form (json): save
Cms.prototype.form_post = function (req, res) {
  var self = this;
  var meta = self.meta;
  var object = req.object || new req.model();
  var data = JSON.parse(req.body.val);
  var schema_info = utils.get_schema_info(req.schema);

  var presave = this.meta.info[req.type].presave;
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
    if (!object.state && workflow && workflow.states)
      object.state = workflow.states[0].code;

    //self.emit('pre save', object);
    object.save(function (err, s) {
      if (err)
      {
        logger.error(err);
        res.json({error: err});
        return;
      }
      self.add_log(req.session.user._id, 'save', req.type, s, info, function () {
        meta.expand(req.type, s._id, function (err, s) {
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
  req.object.remove(function (err, m) {
    res.json(m);
  });
};


// form (json): workflow state
Cms.prototype.form_status = function (req, res) {
  var self = this;
  var original_state = req.object.state;
  req.object.state = req.body.state;
  req.object.save(function (err, m) {
    self.add_log(req.session.user._id, 'change status', req.type, m,
      {message: 'From ' + original_state + 'to ' + req.object.state, reason: req.param.reason}, function (info) {
        // todo find open related requests - notify requestors & close requests
        res.json(info);
      });
  });
};


// logs
Cms.prototype.logs_for_user = function (req, res) {
  this.get_logs({user: req.session.user._id}, {sort: '-time'}, function (logs) {
    res.json(logs);
  });
};


Cms.prototype.logs_for_record = function (req, res) {
  this.get_logs({type: req.params.type, id: req.params.id }, {sort: '-time'}, function (logs) {
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
      meta.model(log.type).findOne({_id: log.id}, function (err, l) {
        if (!log.info)
          log.info = {};
        log.info.object = l;
        n();
      });
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
      type: type,
      id: instance._id,
      info: info
    }
  );
  log.save(function (err, l) {
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


Cms.prototype.upload = function (req, res) {
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
  //stream.on('error', function (e) {
  //  next(e);
  //});
  switch (self.config.storage) {
    case "file":
      new Error('unimplemented');
      break;
    case "pkgcloud":
      stream.pipe(self.client.upload(client_upload_params(self.config, path), next));
      break;
    case "cloudinary":
      // untested
      var cloudStream = cloudinary.uploader.upload_stream(next);
      stream.on('data', cloudStream.write).on('end', cloudStream.end);
      break;
    case "gfs":
      var ws = self.gfs.createWriteStream({ filename: path });
      stream.pipe(ws);
      stream.on('end', next);
      //ws.on('error', function (e) {
      //  next(e);
      //});
      break;
  }
}


Cms.prototype.delete_resource = function (req, res) {
  var self = this;
  var Resource = self.meta.Resource;
  var q = Resource.findOne({_id: req.params.id});
  q.exec(function (err, r) {
    if (err) throw err;
    if (r) {
      switch (config.storage) {
        case "pkgcloud":
          self.client.removeFile(config.container, r.path, function (err) {
            if (err) logger.error(err);
            r.remove(function (err, r) {
              if (err) throw err;
              logger.info('resource ' + JSON.stringify(r) + ' deleted')
              res.json({message: 'Resource deleted'});
            });
          });
          break
        case "cloudinary":
          cloudinary.uploader.destroy(r.meta.public_id, function (result) {
            res.json(result);
          });
          break
        case "gfs":
        default:
          break;
      }
    }
    else {
      res.send('ERR');
    }
  });
};


Cms.prototype.download = function (req, res) {
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
