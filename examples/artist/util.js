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