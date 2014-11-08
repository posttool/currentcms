var mongoose = require("mongoose");
var ObjectId = mongoose.Schema.Types.ObjectId;
var cms_models = require("../modules/cms/models");

exports = module.exports = {

  /* hackett mill calls their catalog of art "inventory" */
  Inventory: {
    meta: {
      plural: "Inventory",
      name: "<%= title %>",
      dashboard: true,
      workflow: true
    },
    schema: {
      title: String,
      code: String,
      description: String,
      resources: [
        {type: ObjectId, ref: "Resource"}
      ],
      use: String,
      alignment: String,
      year: String,
      materials: String,
      dimensions: String
    },
    browse: [
      {name: "title", cell: "char", filters: ["$regex", "="], order: "asc,desc"},
      {name: "code", cell: "char", filters: ["$regex", "="], order: "asc,desc,default"},
      {name: "resources", cell: "image" },
      {name: "year", cell: "string", filters: ["$regex"], order: "asc,desc"},
      {name: "modified", cell: "int", filters: ["$gt", "$lt", "$gte", "$lte"], order: "asc,desc"},
      {name: "state", cell: "int", filters: ["="], order: "asc,desc"},
    ],
    form: [
      {begin: "row"},
        {begin: "col", options: {className: "two-col"}},
          {name: "title", widget: "input", options: {className: "large", width: "80%"}},
          {name: "code", widget: "input", options: {className: "large", width: "20%"}},
        {end: "col" },
        {begin: "col", options: {className: "two-col"}},
          {name: "resources", widget: "upload", options: {type: "Resource", array: true}},
        {end: "col" },
      {end: "row" },
      {name: "description", widget: "rich_text"},
      {begin: "row"},
        {begin: "col", options: {className: "two-col"}},
          {name: "use", widget: "input", help: "More details about the use."},
          {name: "alignment", widget: "input"},
          {name: "year", widget: "input"},
        {end: "col" },
        {begin: "col", options: {className: "two-col"}},
          {name: "materials", widget: "input"},
          {name: "dimensions", widget: "input"},
        {end: "col" },
      {end: "row"}
    ]
  },

  Artist: {
    meta: {
      plural: "Artists",
      name: "<%= first_name %> <%= last_name %>",
      dashboard: true
    },
    schema: {
      first_name: String,
      last_name: String,
      description: String,
      work: [
        {type: ObjectId, ref: "Inventory"}
      ]
    },
    browse: [
      {name: "first_name", cell: "char", filters: ["$regex", "="], order: "asc,desc"},
      {name: "last_name", cell: "char", filters: ["$regex", "="], order: "asc,desc,default"},
      {name: "modified", cell: "int", filters: ["$gt", "$lt", "$gte", "$lte"], order: "asc,desc"}
    ],
    form: [
      {begin: "row"},
        {begin: "col", options: {className: "two-col"}},
          {name: "first_name", widget: "input"},
          {name: "last_name", widget: "input"},
          {name: "description", widget: "rich_text"},
        {end: "col" },
        {begin: "col", options: {className: "two-col"}},
          {name: "work", widget: "choose_create", options: {type: "Inventory", array: true}},
        {end: "col" },
      {end: "row"}
    ]
  },

  Exhibition: {
    meta: {
      plural: "Exhibitions",
      name: "<%= title %>",
      dashboard: true
    },
    schema: {
      title: String,
      subtitle: String,
      images: [
        {type: ObjectId, ref: "Inventory"}
      ],
      start_date: Date,
      end_date: Date,
      opening_date: Date,
      opening_length: String,
      essays: [
        {type: ObjectId, ref: "Essay"}
      ],
      catalog: {type: ObjectId, ref: "Catalog"}
    },
    browse: [
      { name: "title",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "subtitle",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "start_date",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "end_date",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "opening_date",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "modified",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
    ],
    form: [
      { name: "title", widget: "input" },
      { name: "subtitle", widget: "input" },
      {begin: "row"},
        {begin: "col", options: {className: "two-col"}},
          { name: "images",
            widget: "choose_create",
            options: { type: "Inventory", array: true } },
        {end: "col" },
        {begin: "col", options: {className: "two-col"}},
          { name: "start_date", widget: "date" },
          { name: "end_date", widget: "date" },
          { name: "opening_date", widget: "date" },
          { name: "opening_length", widget: "number" },
          { name: "essays",
            widget: "choose_create",
            options: { type: "Essay", array: true } },
          { name: "catalog",
            widget: "choose_create",
            options: { type: "Catalog", array: false } },
        {end: "col" },
      { end: "row"},
    ]
  },

  Contact: {
    meta: {
      plural: "Contacts",
      name: "<%= title %>",
      dashboard: true
    },
    schema: {
      title: String,
      overview: String,
      directions: String,
      address_line_1: String,
      address_line_2: String,
      city: String,
      state: String,
      zip: String,
      email: String,
      phone: String,
      mobile: String
    },
    browse: [
      { name: "title",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "overview",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "directions",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "address_line_1",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "address_line_2",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "city",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "state",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "zip",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "email",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "modified",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" }
    ],
    form: [
      { name: "title", widget: "input" },
      { name: "overview", widget: "rich_text" },
      { name: "directions", widget: "rich_text" },
      { name: "address_line_1", widget: "input" },
      { name: "address_line_2", widget: "input" },
      { name: "city", widget: "input" },
      { name: "zip", widget: "input" },
      { name: "email", widget: "input" },
      { name: "phone", widget: "input" },
      { name: "mobile", widget: "input" }
    ]
  },

  Essay: {
    meta: {
      plural: "Essays",
      name: "<%= title1 %>"
    },
    schema: {
      title1: String,
      title2: String,
      title3: String,
      author: String,
      audio_bio: String,
      body: String
    },
    browse: [
      { name: "title1",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "title2",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },

      { name: "author",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "modified",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
    ],
    form: [
      { name: "title1", widget: "input" },
      { name: "title2", widget: "input" },
      { name: "title3", widget: "input" },
      { name: "author", widget: "input" },
      { name: "audio_bio", widget: "input" },
      { name: "body", widget: "input" }
    ]

  },

  Catalog: {
    meta: {
      plural: "Catalogs",
      name: "<%= title %>"
    },
    schema: {
      price: Number,
      title: String,
      caption: String,
      images: [
        {type: ObjectId, ref: "Resource"}
      ]
    },
    browse: [
      { name: "title",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "price",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "images",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
      { name: "modified",
        cell: "char",
        filters: [ "$regex", "=" ],
        order: "asc,desc,default" },
    ],
    form: [
      { name: "price", widget: "input" },
      { name: "title", widget: "input" },
      { name: "caption", widget: "input" },
      { name: "images",
        widget: "choose_create",
        options: { type: "Resource", array: true } } ]

  },

  /* pages */
  Page: {
    meta: {
      plural: "Pages",
      name: "<%= title %>",
      dashboard: true
    },
    schema: {
      title: String,
      subtitle: String,
      body: mongoose.Schema.Types.Mixed,
      pages: [
        {type: ObjectId, ref: "Page"}
      ]
    },
    browse: [
      {name: "title", cell: "char", filters: ["$regex", "="], order: "asc,desc,default"},
      {name: "subtitle", cell: "char", filters: ["$regex", "="], order: "asc,desc"},
      {name: "modified", cell: "int", filters: ["$gt", "$lt", "$gte", "$lte"], order: "asc,desc"}

    ],
    form: [
      {name: "title", widget: "input"},
      {name: "subtitle", widget: "input"},
      {name: "body", widget: "page"},
      {name: "pages", widget: "choose_create", options: {type: "Page", array: true}}
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

  Resource:  cms_models.ResourceInfo(),
  User: cms_models.UserInfo()

}


exports.Resource.jobs = {
  image: ['thumb', 'medium', 'large'],
  audio: ['mp3'],
  video: []
}



