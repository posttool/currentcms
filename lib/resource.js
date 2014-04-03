var mongoose = require('mongoose'),
  ObjectId = mongoose.Schema.Types.ObjectId;

var ResourceSchemaInfo = {
  name: String,
  path: String,
  size: Number,
  mime: String,
  meta: mongoose.Schema.Types.Mixed,
  children: [{
    path: String,
    size: Number,
    mime: String,
    meta: mongoose.Schema.Types.Mixed
  }]
};

exports.models = {

  Resource: {
    meta: {
      plural: 'Resources',
      dashboard: true
    },
    schema: ResourceSchemaInfo,
    browse: [
      {name: "path", cell: "char", filters: ["$regex", "="], order: "asc,desc"},
      {name: "size", cell: "int", filters: ["$gt", "$lt", "$gte", "$lte"], order: "asc,desc"},
      {name: "mime", cell: "char", filters: ["$regex", "="], order: "asc,desc"},
    ],
    form: [
      {name: "path", widget: "resource_path"},
      {name: "size", widget: "number"},
      {name: "mime", widget: "input"},
      {name: "meta", widget: "json"},
      {name: "children", widget: "choose_create", options: {type: "Resource", array: true, readonly: true}}
    ]
  }

}
