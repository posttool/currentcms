Current Content Management
==========

A simple Node/Mongo CMS. In development. 

Uses Mongoose schema and a basic language for building forms and browsers.

Includes some basic workflow related to publishing...

## Installation

```bash
npm install currentcms
```

## Usage

To get the CMS up and running, you must start a new project with some basic schema. Sample projects are coming.

Then start the express admin user interface with supplied cli ```forever start mycmsconfig server```.

Use the models to build your public application:

``` js
  var current = require('currentcms');
  var cms = new current.Cms(require('./mycmsconfig'));
  var Artist = cms.meta.model('Artist');
  Artist.findOne({name: 'Marcel'}).exec(function(etc...
```
