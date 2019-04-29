var express = require('express');
var router = express.Router();

var my = require('../lib/my modules/compile_code');
var db_my = require('../lib/my modules/database_helper_functions');

/* Mongoose stuff and models */
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOOSE_ADDRESSE, {useNewUrlParser: true});

var Exercises = require('../lib/models/exercises_model');
var Hierarchy = require('../lib/models/hierarchy_model');



/* detailed exercise page */
router.get('/', function(req, res, next) {
  res.render('exercises/details');
});


router.get('/id/:exercise_id', function(req, res, next) {
  Exercises.findOne( { public_id: req.params.exercise_id }, async function(err, exercise) {
    if (err) res.render('exercises/details', {exercise_error: 'ERROR: Exercise not found!'});
    else {
      public_exercise = {
        public_id: exercise.public_id,
        name: exercise.name,
        png: exercise.png,
        tags: exercise.tags,
        author: exercise.author,
      };
      if (req.user) {
        if (req.user.nickname == exercise.author) {
          public_exercise.same_name_check = true;
        } else {public_exercise.same_name_check = false;}
      }
      await db_my.tagList(req);
      res.render('exercises/details', {exercise: public_exercise, tagList: req.session.taglist});
    }
  });
});


router.post('/edit_details', function(req,res,next) {
  Exercises.findOne( { public_id: req.body.hidden_id }, async function(err, exercise) {
    if (err) res.render('exercises/details', {exercise_error: 'ERROR: Exercise not found!'});
    else {
      public_exercise = {
        public_id: exercise.public_id,
        name: exercise.name,
        png: exercise.png,
        tags: exercise.tags,
        author: exercise.author,
      };
      if (req.user) {
        if ( (req.user.user_id == exercise.author_id) || (req.user.groups.indexOf('Admin') > -1) ) {
          public_exercise.same_name_check = true;
        } else {public_exercise.same_name_check = false;}
      }
      await db_my.tagList(req);
      res.render('exercises/edit_details', {exercise: public_exercise, taglist: req.session.taglist});
    }
  });
});


router.post('/change_tags', async function(req,res,next) {
  var changing_exercise = await Exercises.findOne({ public_id: req.body.hidden_id });
  changing_exercise.tags = my.convert2array(req.body.changing_tags);
  changing_exercise.save((err) => {
    if (err) throw err;
    res.redirect('/exercises/id/'+req.body.hidden_id);
  });
});


router.post('/delete', function(req, res, next) {
  Exercises.findOneAndDelete( { public_id: req.body.hidden_id }, function(err, deleted_element){
    if (err) throw err;
    res.render('exercises/delete_successful', {deleted_exercise_name: deleted_element.name});
  })
});





module.exports = router;