var _ = require('lodash');

var PNAME = "parent";
var CNAME = "pages";

function findById(node, id) {
  if (node == null)
    return null;
  if (node.id == id)
    return node;
  if (node[CNAME]) {
    for (var i = 0; i < node[CNAME].length; i++) {
      var nn = findById(node[CNAME][i], id);
      if (nn != null)
        return nn;
    }
  }
  return null;
}
exports.findById = findById;

function getNextNode(origin) {
  //otherwise, get 'next' node
  var next = getFirstChild(origin);
  if (next == null)
    next = getSibling(origin);
  if (next == null)
    next = getAncestorsSibling(origin);
  if (next == null)
    return getRoot(origin);
  if (isEmptyNode(next))
    return getNextNode(next);
  return next;
}
exports.getNextNode = getNextNode;

function getRoot(node){
  var p = node;
  while (p.parent != null) {
    p = p.parent;
  }
  return p;
}

function isEmptyNode(node){
  return node.resources.length==0;
}

function getFirstChild(node) {
  var c = node[CNAME];
  if (c == null || c.length == 0)
    return null;
  return c[0];
}


function getSibling(node) {
  if (node[PNAME] == null)
    return null;
  var parent = node[PNAME];
  var siblings = parent[CNAME];
  var index = siblings.indexOf(node) + 1;
  if (index > siblings.length - 1)
    return null;
  return siblings[index];
}


function getAncestorsSibling(node)
{
  var p = node[PNAME];
  while (p != null) {
    var s = getSibling(p);
    if (s != null)
      return s;
    p = p[PNAME];
  }
  return null;
}



//	getPrevNode: function(origin,idx)
//	{
//		//step thru images of portfolio
//		var children;
//		var prev = getPreviousSibling(self.root_node, origin);
//		if (prev==null)
//			prev = origin._attributes.parent_node;
//		if (prev==null)
//			prev = self.root_node;
//
//		var sel_idx=0;
//		if (prev._attributes.data._type=='Portfolio')
//		{
//			children = prev._attributes.data._attributes.images;
//			if (children!=null && children.length!=0)
//				sel_idx = children.length - self.portfolio_length_offset;
//		}
//
//		return {node: prev, idx:sel_idx};
//	}





// utils
var site = null;
var lastTime = null;

exports.getSiteMapData = function(Page, add_parents, page_view, next) {
  if (arguments.length == 1) {
    next = function(){}
    add_parents = false;
    page_view = default_page_view;
  }
  else if (arguments.length == 2) {
    next = add_parents;
    add_parents = false;
    page_view = default_page_view;
  }
  else if (arguments.length == 3) {
    next = page_view;
    add_parents = false;
    page_view = add_parents;
  }

  if (!site || !lastTime || lastTime.getTime() + 60000 < Date.now()) {
    Page.find({})//state: PUBLISHED
      .populate('resources')
      .exec(function (err, pages) {
        if (err) return next(err);
        var pages_view = [];
        for (var i=0; i<pages.length; i++){
          var p = pages[i];
          pages_view.push(page_view(p));
        }
        site = exports.getSiteMap(pages_view, add_parents);
        next(null, site);
      });
  } else {
    next(null, site);
  }
}

function default_page_view(p) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    url: p.url,
    pages: p.pages,
    resources: _.map(p.resources, function (o) {
      return {description: o.description, public_id: o.meta.public_id}
    }),
    template: p.template
  };
}

exports.getSiteMap = function(pages, add_parents) {
  var m = {};
  for (var i = 0; i < pages.length; i++)
    m[pages[i].id] = pages[i];
  var root = null;
  for (var i = 0; i < pages.length; i++) {
    var p = pages[i];
    if (p.url == "/")
      root = p;
    for (var j = 0; j < p.pages.length; j++) {
      p.pages[j] = m[p.pages[j]];
      if (add_parents)
        p.pages[j].parent = p;
    }
  }
  // s/could go through and delete nulls (the result of unpublished children)
  return root;
}

exports.getResources = function(page, resources) {
  if (resources == null)
    resources = [];
  if (page.resources) {
    for (var i = 0; i < page.resources.length; i++) {
      var r = page.resources[i];
      r.source = {page: page._id, url: page.url, index: i};
      resources.push(r);
    }
  }
  if (page.pages) {
    for (var i = 0; i < page.pages.length; i++) {
      exports.getResources(page.pages[i], resources);
    }
  }
  return resources;
}

exports.get_res_bp = function(config){
  return "http://res.cloudinary.com/"+config.cloudinaryConfig.cloud_name+"/image/upload";
}