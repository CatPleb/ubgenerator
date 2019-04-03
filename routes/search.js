var express = require('express');
var router = express.Router();

var my = require('../lib/my modules/compile_code');
var util = require('util');

/* Mongoose stuff and models */
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOOSE_ADDRESSE);

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
  var selectedtag = my.convert2array(req.query.selecttag);

  if (!req.session.taglist) {
    await tagList(req);         // create a list with all possible tags
  }
  if (selectedtag == undefined) {
    res.render('search/search', {taglist: req.session.taglist});
  } else if (selectedtag.indexOf('All') >= 0) {

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
    Hierarchy.find({ tag: { $in: selectedtag }}, async function(err, doc) {
      
      /* Now search for every exercise which has one of those ids in it */
      var promises_tags = selectedtag.map(async function(stag) {
        return Hierarchy.find({ tag: stag });
      });
      
      Promise.all(promises_tags).then((db_tags) => {
        
        newtagList = []
        db_tags.forEach((db_tag) => {
          newtagList = newtagList.concat(db_tag[0].subtree_tags);
        })

        Exercises.find( { tag: { $in: newtagList }}, function(err,result) {

          var public_result = [];
          for (i=0; i<result.length; i++) {

            console.log(result[i].name);
            public_result.push({
              name: result[i].name,
              png: result[i].png,
              tag: result[i].tag,
              public_id: ('/exercises/id/'+result[i].public_id),
            });

          }
          res.render('search/search', {result: public_result, taglist: req.session.taglist, selectedtag: selectedtag});
        });
      })  
    });
      

  } else {
    res.render('search/search', {taglist: req.session.taglist});
  }
});




module.exports = router;