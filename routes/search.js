var express = require('express');
var router = express.Router();

/* Mongoose stuff and models */
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/public');

var Exercises = require('../lib/models/exercises_model');
var Hierarchy = require('../lib/models/hierarchy_model');



function tagList(req) {
  return new Promise((resolve) => {
    var taglist = [];
    Hierarchy.find(function(err, docs) {
      for (i=0; i<docs.length; i++) {
        taglist.push(docs[i].tag);
      }
      req.session.taglist = taglist;
      resolve();
    });
  });
}

/* show all exercises page */
router.get('/', async function(req, res, next) {
  var selectedtag = req.query.selecttag;

  if (!req.session.taglist) {
    await tagList(req);         // create a list with all possible tags
  }
  if (selectedtag == 'All') {

    Exercises.find().then(function(result) {
      var public_result = [];
          for (i=0; i<result.length; i++) {

            public_result.push({
              name: result[i].name,
              png: result[i].png,
              tag: result[i].tag,
              public_id: ('/exercises/id/'+result[i].public_id),
            });
            
          }
          res.render('search/search', {result: public_result, taglist: req.session.taglist, selectedtag: selectedtag});
    })

  } else if (selectedtag) {

    /* Get ids from searchtag and all children */
    Hierarchy.findOne({ tag: selectedtag }, function(err, doc) {
      var idArray = [doc._id];
      doc.getChildren(function(err,childrenArray) {
        for (i = 0; i < childrenArray.length; i++) {
          idArray.push(childrenArray[i]._id);
        }
        /* Now search for every exercise which has one of those ids in it */
        Exercises.find( { tag_id: { $in: idArray }}, function(err,result) {         // EXERCISE MODEL tag_id

          var public_result = [];
          for (i=0; i<result.length; i++) {

            public_result.push({
              name: result[i].name,
              png: result[i].png,
              tag: result[i].tag,
              public_id: ('/exercises/id/'+result[i].public_id),
            });

          }
          res.render('search/search', {result: public_result, taglist: req.session.taglist, selectedtag: selectedtag});
        });
      });
    });

  } else {
    res.render('search/search', {taglist: req.session.taglist});
  }
});




module.exports = router;