var express = require('express');
var router = express.Router();

var my = require('../lib/my modules/compile_code');
var db_my = require('../lib/my modules/database_helper_functions');
var util = require('util');

/* Mongoose stuff and models */
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOOSE_ADDRESSE, {useNewUrlParser: true});

var Exercises = require('../lib/models/exercises_model');
var Hierarchy = require('../lib/models/hierarchy_model');



/* show all exercises page */
router.get('/', async function(req, res, next) {
  var selectedtag = my.convert2array(req.query.selecttag);

  // create a list with all possible tags
  await db_my.tagList(req);
  
  if (selectedtag == undefined) {
    res.render('search/search', {taglist: req.session.taglist});
  } else if (selectedtag.indexOf('All') >= 0) {

    Exercises.find().then(function(result) {
      var public_result = [];
          for (i=0; i<result.length; i++) {

            public_result.push({
              name: result[i].name,
              png: result[i].png,
              tags: result[i].tags,
              public_id: ('/exercises/id/'+result[i].public_id),
            });
            
          }
          res.render('search/search', {result: public_result, taglist: req.session.taglist, selectedtag: selectedtag});
    })

  } else if (selectedtag) {

    /* Get ids from searchtag and all children */
    Hierarchy.find({ name: { $in: selectedtag }}, async function(err, doc) {
      
      /* Now search for every exercise which has one of those ids in it */
      var promises_tags = selectedtag.map(async function(stag) {
        return Hierarchy.find({ name: stag });
      });
      
      Promise.all(promises_tags).then((db_tags) => {
        
        newtagList = []
        for (i=0;i<db_tags.length;i++) {
          newtagList = newtagList.concat(db_tags[i][0].subtree_tags);
        }

        Exercises.find( { tags: { $in: newtagList }}, function(err,result) {

          var public_result = [];
          for (i=0; i<result.length; i++) {

            public_result.push({
              name: result[i].name,
              png: result[i].png,
              tags: result[i].tags,
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