var express = require('express');
var adminsecured = require('../lib/middleware/adminsecured');
var router = express.Router();

var my = require('../lib/my modules/compile_code');
var myhelper = require('../lib/my modules/database_helper_functions');
var util = require('util');

/* Mongoose stuff and models */
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOOSE_ADDRESSE, {useNewUrlParser: true});

var Exercises = require('../lib/models/exercises_model');
var Hierarchy = require('../lib/models/hierarchy_model');



router.post('/', adminsecured(), async function(req, res, next) {
  res.render('database/db_index', {});
});

router.post('/overview_tags', adminsecured(), function(req,res,next) {
  res.render('database/overview_tags', {})
});

router.post('/manage_tags', adminsecured(), function(req,res,next) {
  res.render('database/manage_tags', {})
});


// html site for form to create new tag
router.post('/create_tags', adminsecured(), function(req,res,next) {
  Hierarchy.find().then(function(result) {
    tagList = myhelper.get_tags(result);
    res.render('database/create_tags', {tagList: tagList, create_error: [req.session.error] });
    req.session.error = undefined;
  }).catch(function(err) {
    if (err) throw err;
  });
});


// check if input is valid and if so, create new tag in database, set relationships
router.post('/engrave_new_tag', adminsecured(), async function(req,res,next) {

  var boo = await myhelper.check_and_engrave(req.body.tag_name, req.body.parent_tags, req.body.child_tags);
  console.log(boo);

  if (boo[0] == false) {
    req.session.error = boo[1];
    res.redirect(307,'/database/create_tags');
  } else if (boo[0] == true) {
    req.session.error = 'Tag created succesfully. Database updated.';
    res.redirect(307, '/database/create_tags');
  } else {
    console.log('ERROR: Something went terribly wrong!\nboo[0] = '+boo[0]+'\nboo[1] = '+boo[1]);
    req.session.error = 'ERROR: Critical Error!';
    res.redirect(307, '/database/create_tags');
  }
});

router.post('/delete_tags', adminsecured(), function(req,res,next) {
  res.render('database/delete_tags', {})
});


module.exports = router;