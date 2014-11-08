var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Mixed = mongoose.Schema.Types.Mixed;
var bcrypt   = require('bcrypt-nodejs');
var CmsModels = require('../../../currentcms/lib/models');
var utils = require('../../../currentcms/lib/utils');

exports = module.exports = {

  InventoryItem: {
    meta: {
      plural: 'Inventory',
      name: '<%= name %>',
      dashboard: true
    },
    schema: {
      list: [],
    },
    pre_remove: function (i, next) {
      utils.removeEach(i.list, next);
    }
  },

  Customer: {
    meta: {
      plural: 'Customers',
      name: '<%= google.email %>',
      dashboard: true,
      workflow: false
    },
    schema: {
      local: {
        email: String,
        password: String
      },
      facebook: {
        id: String,
        token: String,
        email: String,
        name: String
      },
      twitter: {
        id: String,
        token: String,
        displayName: String,
        username: String
      },
      google: {
        id: String,
        token: String,
        email: String,
        name: String
      }
    },
    methods: {
      generateHash: function (password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
      },
      validPassword: function (password) {
        return bcrypt.compareSync(password, this.local.password);
      },
      identifier: function () {
        if (this.local.email)
          return this.local.email;
        else if (this.facebook.name)
          return this.facebook.name;
        else if (this.twitter.username)
          return this.twitter.username;
        else if (this.google.name)
          return this.google.name;
      }
    }
  },

  CustomerAddress: {
    meta: {
      plural: 'Customer Address',
      name: '<%= name %>',
      dashboard: true,
      workflow: false
    },
    schema: {
      user: {type: ObjectId, ref: 'Customer'},
      name: String,
      address: String
    }
  },

  Invoice: {
    meta: {
      plural: 'Invoices',
      name: '<%= title %>',
      dashboard: true,
      workflow: false
    },
    schema: {
      user: {type: ObjectId, ref: 'Customer'},
      title: String,
      description: String,
      items: Mixed,
      total: Number,
      stripeReference: String
    }
  },

  Page: {
    meta: {
      plural: 'Pages',
      name: '<%= title %>',
      dashboard: true,
      workflow: false
    },
    schema: {
      title: String,
      subtitle: String,
      body: mongoose.Schema.Types.Mixed,
      pages: [
        {type: ObjectId, ref: 'Page'}
      ],
      url: String,
      template: String,
      description: String,
      resources: [
        {type: ObjectId, ref: 'Resource'}
      ]
    },
    browse: [
      {name: 'title', cell: 'char', filters: ['$regex', '='], order: 'asc,desc'},
      {name: 'url', cell: 'char', filters: ['$regex', '='], order: 'asc,desc,default'},
      {name: 'resources', cell: 'image' },
      {name: 'modified', cell: 'int', filters: ['$gt', '$lt', '$gte', '$lte'], order: 'asc,desc'},
      {name: 'state', cell: 'int', filters: ['='], order: 'asc,desc'}
    ],
    form: [
      {name: 'title', widget: 'input', options: {className: 'large'}},
      {name: 'url', widget: 'input'},
      {name: 'template', widget: 'select', options: {options: [ 'Portfolio', 'LandingPage', 'InformationPage', 'Contact' ]}},
      {name: 'resources', label: 'images', widget: 'upload', options: {type: 'Resource', array: true}},
      {name: 'body', widget: 'rich_text_cee', options: {collapsable: true, collapsed: false}},
      {name: 'pages', widget: 'choose_create', options: {type: 'Page', array: true}}
    ]

  },

  News: {
    meta: {
      plural: 'News',
      name: '<%= title %>',
      dashboard: true,
      workflow: false
    },
    schema: {
      title: String,
      subtitle: String,
      body: String,
      release_date: Date
    },
    browse: [
      {name: 'title', cell: 'char', filters: ['$regex', '='], order: 'asc,desc,default'},
      {name: 'release_date', cell: 'date', filters: ['$gt', '$lt', '$gte', '$lte'], order: 'asc,desc'},
      {name: 'modified', cell: 'int', filters: ['$gt', '$lt', '$gte', '$lte'], order: 'asc,desc'}
    ],
    form: [
      {name: 'title', widget: 'input'},
      {name: 'subtitle', widget: 'input'},
      {name: 'body', widget: 'rich_text', options: {collapsable: true, collapsed: true}},
      {name: 'release_date', widget: 'date'}
    ]
  },

  BlogEntry: {
    meta: {
      plural: 'Blog Entries',
      name: '<%= title %>',
      dashboard: true
    },
    schema: {
      title: String,
      subtitle: String,
      body: String,
      release_date: Date
    },
    browse: [
      {name: 'title', cell: 'char', filters: ['$regex', '='], order: 'asc,desc,default'},
      {name: 'release_date', cell: 'date', filters: ['$gt', '$lt', '$gte', '$lte'], order: 'asc,desc'},
      {name: 'modified', cell: 'int', filters: ['$gt', '$lt', '$gte', '$lte'], order: 'asc,desc'}
    ],
    form: [
      {name: 'title', widget: 'input'},
      {name: 'subtitle', widget: 'input'},
      {name: 'body', widget: 'rich_text', options: {collapsable: true, collapsed: true}},
      {name: 'release_date', widget: 'date'}
    ]
  },

  Resource: CmsModels.ResourceInfo(),
  User: CmsModels.UserInfo()

}



exports.Resource.jobs = {
  image: ['thumb', 'medium', 'large'],
  audio: ['mp3'],
  video: []
}