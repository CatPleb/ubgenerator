var dotenv = require('dotenv');
var result = dotenv.config();
if (result.error) {
  throw result.error;
}
console.log(result.parsed);

/* Mongoose stuff and models */
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOOSE_ADDRESSE);

var tagfunctions = require('./tag_search.js');

var Exercises = require('../models/exercises_model');
var Hierarchy = require('../models/hierarchy_model');


tag = 'Optimierung';
tagfunctions.subtree(tag, function(err, subtree_idList) {
  console.log('\nERROR: '+err);
  console.log('FINISHED SUBTREE LIST: '+subtree_idList);
  Hierarchy.find({ _id: { $in: subtree_idList }}, function(err,result) {
    var public_result = [];
    for (i=0; i<result.length; i++) {
      public_result.push(result[i].name);
    }
    public_result.map(s => mongoose.Types.ObjectId(s));
    console.log('HERE: '+public_result);
    process.exit();
  })
});