var DRAFT = 'draft';
var PUBLISHED = 'published';
var FLAGGED = 'flagged';

exports = module.exports = {
  default: DRAFT,
  states: [DRAFT, PUBLISHED, FLAGGED],
  DRAFT: { name: "Draft" },
  PUBLISHED: {name: "Published", read_only: true},
  FLAGGED: {name: "Flagged"},
  groups: {
    admin: "editor",
    editor: {
      transitions: [
        {from: DRAFT, to: [PUBLISHED, FLAGGED]},
        {from: PUBLISHED, to: [FLAGGED, DRAFT]},
        {from: FLAGGED, to: [PUBLISHED, DRAFT]}
      ]
    },
    contributor: {
      transitions: [],
      requests: [
        {from: DRAFT, to: [PUBLISHED]},
        {from: PUBLISHED, to: [DRAFT]},
        {from: PUBLISHED, to: [FLAGGED]}
      ]
    }
  }
}
