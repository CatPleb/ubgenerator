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



/* define function for accessing database in search of selected tags */
var get_exercises = async function(selectedtag, headline_search, code_search) {

  if (selectedtag && selectedtag.length) {
    
    var promises_tags = selectedtag.map(async function(stag) {
      return Hierarchy.find({ name: stag });
    });
    
    db_tags = await Promise.all(promises_tags);

    newtagList = db_tags[0][0].subtree_tags;
    for (i=1;i<db_tags.length;i++) {
      newtagList = newtagList.filter(value => db_tags[i][0].subtree_tags.includes(value));
    }

    //result = await Exercises.find( { tags: { $in: newtagList }, name: { $regex: headline_search, $options: 'i'},
    //                                 code: { $regex: code_search, $options: 'i'}});

    if (headline_search && code_search) {
      result = await Exercises.find({ tags: { $in: newtagList }, name: { $regex: headline_search, $options: 'i'},
                                    code: { $regex: code_search, $options: 'i'}});
    } else if (headline_search) {
      result = await Exercises.find({ tags: { $in: newtagList }, name: { $regex: headline_search, $options: 'i'}});
    } else if (code_search) {
      result = await Exercises.find({ tags: { $in: newtagList }, code: { $regex: code_search, $options: 'i'}});
    } else {
      result = await Exercises.find({ tags: { $in: newtagList } });
    }

    var public_result = [];
    for (i=0; i<result.length; i++) {

      public_result.push({
        name: result[i].name,
        png: result[i].png,
        tags: result[i].tags,
        public_id: ('/exercises/id/'+result[i].public_id),
      });

    }
    return public_result;
 
  } else {
    // selectedtag is undefined

    if (headline_search && code_search) {
      result = await Exercises.find({name: { $regex: headline_search, $options: 'i'},
                                    code: { $regex: code_search, $options: 'i'}});
    } else if (headline_search) {
      result = await Exercises.find({name: { $regex: headline_search, $options: 'i'}});
    } else if (code_search) {
      result = await Exercises.find({code: { $regex: code_search, $options: 'i'}});
    } else {
      result = await Exercises.find();
    }
    var public_result = [];
    for (i=0; i<result.length; i++) {

      public_result.push({
        name: result[i].name,
        png: result[i].png,
        tags: result[i].tags,
        public_id: ('/exercises/id/'+result[i].public_id),
      });
      
    }
    return public_result;
  }
};


/* show all exercises page */
router.get('/', async function(req, res, next) {
  var selectedtag = my.convert2array(req.query.selecttag);

  // create a list with all possible tags
  if (!(req.session.taglist)) await db_my.tagList(req, selectedtag);

  newtaglist = []
  for (i=0;i<req.session.taglist.length;i++) {
    
    if (selectedtag.includes(req.session.taglist[i])) {
      newtaglist.push({ tag: req.session.taglist[i], selected: true });
    } else {
      newtaglist.push({ tag: req.session.taglist[i] });
    }
  }


  public_result = await get_exercises(selectedtag, req.query.headline_search, req.query.code_search);
  
  if (!(selectedtag && selectedtag.length)) selectedtag = 'All';
  res.render('search/search', {result: public_result, taglist: newtaglist, selectedtag: selectedtag,
                              headline_search: req.query.headline_search, code_search: req.query.code_search});
  
});




module.exports = router;