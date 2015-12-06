Current Content Management
==========

A simple Node/Mongo CMS. In development &ndash; perfectly useful for admin view of db. Uses Mongoose schema and forms meta data.


## Installation

```bash
npm install currentcms
```

## Usage

To get the CMS up and running, you must start a new project with some basic schema. Sample projects are in the examples directory. 

## models.js

The "gallery" example defines artists and their works as well as exhibitions and other collections. Take a look at gallery [models.js](https://github.com/posttool/currentcms/blob/master/examples/gallery/models.js) for complete details. Each model requires ```meta```, ```schema``` properties. These are suffiencient to produce the generated CMS. 

```
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
    }
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
    }
  }
```

To customize the form, use ```browse```, and ```form``` properties. If browse and form properties are left empty, the CMS will show every field in the schema. It will also for convenience dump the browse and form meta data to console so it can be pasted and editted. There are other hooks for save callbacks, custom widget inclusion and more. Docs to come based on general interest.

```
Inventory: {
    meta: {...},
    schema: {...},
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
    meta: {...},
    schema: {...},
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
  }
```

Then start the express admin user interface with supplied cli ```forever start mycmsconfig server```. Create
administrator accounts with ```node mycmsconfig admin```.

Use the models to build your public application:

``` js
  var current = require('currentcms');
  var cms = new current.Cms(require('./mycmsconfig'));
  var Artist = cms.meta.model('Artist');
  Artist.findOne({name: 'Marcel'}).exec(function(etc...
```


