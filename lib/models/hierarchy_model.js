var mongoose = require('mongoose');
var materializedPlugin = require('mongoose-tree-materialized');
var Schema = mongoose.Schema;

var hierarchySchema = new Schema({
  tag: {type: String, required: true},
  }, {collection: 'hierarchy'});
hierarchySchema.plugin(materializedPlugin);

module.exports = mongoose.model('Hierarchy', hierarchySchema);