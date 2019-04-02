var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var hierarchySchema = new Schema({
  tag: {type: String, required: true},
  parentId: [ObjectId],
  subtree_tags: [String],
  }, {collection: 'hierarchy'});

module.exports = mongoose.model('Hierarchy', hierarchySchema);