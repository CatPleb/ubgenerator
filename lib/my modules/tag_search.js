/* Mongoose stuff and models */
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOOSE_ADDRESSE);

var Exercises = require('../models/exercises_model');
var Hierarchy = require('../models/hierarchy_model');


var subtree_recursive = function (tag_id, callback) {
  return new Promise((resolve) => {
    console.log('s_r finding '+tag_id);
    Hierarchy.findOne({_id: tag_id}, function(err,doc) {
      if (err) return callback(tag_id+' was searched for, but it found nothing. Please check if '+tag_id+
        ' is child of some tag and fix/delete if possible');
      tag_id_List = [tag_id];
      console.log('These are the childIds: '+doc.childId);
      for (const childId of doc.childId) {
        subtree_recursive(childId, function(bigError,subtreetagList) {
          if (bigError) return callback(bigError);
          tag_id_List.concat(subtreetagList);
        });
      }
      return callback(null,tag_id_List);
    });
  });
};

// we use 2 functions, because subtree gets a tag, whereas subtree_recursive uses the tag_ids
exports.subtree = function (tag, callback) {
  console.log('Called main function subtree with '+tag);
  Hierarchy.findOne({tag: tag}, function(err, doc) {
    if (err) return callback('No such tag found');
    subtree_recursive(doc._id, function(err, subtree_ids) {
      if (err) return callback(err);
      return callback(null,subtree_ids);
    });
  });
};