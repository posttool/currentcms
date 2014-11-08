var mongoose = require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var cms_models = require("../modules/cms/models");

exports = module.exports = {

  Page: {
    meta: {
      plural: "Pages",
      name: "<%= title %>",
      dashboard: true,
      workflow: true
    },
    schema: {
      title: String,
      subtitle: String,
      body: mongoose.Schema.Types.Mixed,
      pages: [
        {type: ObjectId, ref: "Page"}
      ],
      url: String,
      template: String,
      description: String,
      resources: [
        {type: ObjectId, ref: "Resource"}
      ],
      use: String,
      keywords: String,
      year: String,
      materials: String,
      dimensions: String
    },
    browse: [
      {name: "title", cell: "char", filters: ["$regex", "="], order: "asc,desc"},
      {name: "url", cell: "char", filters: ["$regex", "="], order: "asc,desc,default"},
      {name: "resources", cell: "image" },
      {name: "year", cell: "string", filters: ["$regex"], order: "asc,desc"},
      {name: "modified", cell: "int", filters: ["$gt", "$lt", "$gte", "$lte"], order: "asc,desc"},
      {name: "state", cell: "int", filters: ["="], order: "asc,desc"},
    ],
    form: [
      {name: "title", widget: "input", options: {className: "large"}},
      {name: "url", widget: "input"},
      {name: "template", widget: "select", options: {options: ['portfolio','text1','text2']}},
      {name: "resources", label: "images", widget: "upload", options: {type: "Resource", array: true}},
      {name: "description", widget: "rich_text", options: {collapsable: true, collapsed: true}},
      {name: "pages", widget: "choose_create", options: {type: "Page", array: true}},
    ]
  },

  /* news */
  News: {
    meta: {
      plural: "News",
      name: "<%= title %>",
      dashboard: true
    },
    schema: {
      title: String,
      subtitle: String,
      body: String,
      release_date: Date
    },
    browse: [
      {name: "title", cell: "char", filters: ["$regex", "="], order: "asc,desc,default"},
      {name: "release_date", cell: "date", filters: ["$gt", "$lt", "$gte", "$lte"], order: "asc,desc"},
      {name: "modified", cell: "int", filters: ["$gt", "$lt", "$gte", "$lte"], order: "asc,desc"}
    ],
    form: [
      {name: "title", widget: "input"},
      {name: "subtitle", widget: "input"},
      {name: "body", widget: "rich_text"},
      {name: "release_date", widget: "date"}
    ]
  },

  Resource:  {
    meta: {
      plural: 'Resources',
      workflow: true,
      dashboard: true
    },
    schema: {
      name: String,
      path: String,
      size: Number,
      mime: String,
      meta: mongoose.Schema.Types.Mixed,
      title: String,
      subtitle: String,
      description: String,
      sizes_and_prices: mongoose.Schema.Types.Mixed,
      edition_number: String,
      quantity: Number,
      year: Number,
      for_home_page: Boolean
    },
    browse: [
      {name: "path", cell: "image", filters: ["$regex", "="], order: "asc,desc"},
      {name: "size", cell: "int", filters: ["$gt", "$lt", "$gte", "$lte"], order: "asc,desc"},
      {name: "mime", cell: "char", filters: ["$regex", "="], order: "asc,desc"},
      {name: "for_home_page", cell: "bool", filters: ["$regex", "="], order: "asc,desc"},
    ],
    form: [
      {name: "meta", widget: "resource_meta"},
      {name: "title", widget: "input", options: {className: "large"}},
      {name: "sizes_and_prices", widget: "sizes_and_prices"},

      {begin: "row"},
        {begin: "col", options: {className: "two-col"}},
          {name: "edition_number", widget: "input"},
          {name: "quantity", widget: "input"},
        {end: "col" },
        {begin: "col", options: {className: "two-col"}},
          {name: "year", widget: "input"},
          {name: "for_home_page", widget: "boolean", options: {text: " display on home page"}},
        {end: "col" },
      {end: "row" }
    ],
    includes: ["/js/field_sizes_and_prices.js"]
  },
  User: cms_models.UserInfo()

}



