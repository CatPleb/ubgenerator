var express = require('express');
var adminsecured = require('../lib/middleware/adminsecured');
var router = express.Router();

var my = require('../lib/my modules/compile_code');
var myhelper = require('../lib/my modules/database_helper_functions');
var util = require('util');
var {spawn} = require('child_process');

/* Mongoose models */
var Exercises = require('../lib/models/exercises_model');
var Hierarchy = require('../lib/models/hierarchy_model');



router.post('/', adminsecured(), async function(req, res, next) {
  res.render('database/db_index', {});
});

router.post('/overview_tags', adminsecured(), async function(req,res,next) {
  /*
  console.log(1);
  tagDB = await Hierarchy.find();
  console.log(tagDB);
  var process = spawn('C:/Users/mowol/Anaconda3/python.exe',["./lib/middleware/tagTree.py", 
                            tagDB] );
  process.stdout.on('data', function(data) { 
    console.log(data.toString());
  });
  process.stderr.on('data', function(data) { 
    console.log(data.toString());
  });
  */
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


// html site for form to delete exisiting tag
router.post('/delete_tags', adminsecured(), function(req,res,next) {
  Hierarchy.find().then(function(result) {
    tagList = myhelper.get_tags(result);
    res.render('database/delete_tags', {tagList: tagList, create_error: [req.session.error] });
    req.session.error = undefined;
  }).catch(function(err) {
    if (err) throw err;
  });
});


// check for valid input and delete tag if valid
router.post('/kill_existing_tag', adminsecured(), async function(req,res,next) {
  if ( req.body.selected_tag.localeCompare(req.body.typed_tag) != 0 ) {
    req.session.error = 'ERROR: Selected tag has to equal typed tag.';
    res.redirect(307, '/database/delete_tags');
    return;
  }

  var boo = await myhelper.check_and_kill(req.body.typed_tag);

  if (boo[0] == false) {
    req.session.error = boo[1];
    res.redirect(307,'/database/delete_tags');
  } else if (boo[0] == true) {
    req.session.error = 'Tag deleted succesfully. Database updated.';
    res.redirect(307, '/database/delete_tags');
  } else {
    console.log('ERROR: Something went terribly wrong!\nboo[0] = '+boo[0]+'\nboo[1] = '+boo[1]);
    req.session.error = 'ERROR: Critical Error!';
    res.redirect(307, '/database/delete_tags');
  }
});


module.exports = router;