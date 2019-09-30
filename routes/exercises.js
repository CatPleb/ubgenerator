var express = require('express');
var router = express.Router();

var my = require('../lib/my modules/compile_code');
var db_my = require('../lib/my modules/database_helper_functions');

/* Mongoose stuff and models */
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOOSE_ADDRESSE, {useNewUrlParser: true});

var Exercises = require('../lib/models/exercises_model');
var Hierarchy = require('../lib/models/hierarchy_model');
var Solutions = require('../lib/models/solutions_model');



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
        packages: exercise.packages,
        code: exercise.code,
        tags: exercise.tags,
        author: exercise.author,
      };
      if (req.user) {
        if ( req.user.groups.indexOf('Allowed') > -1 ) {
          public_exercise.allowed = true;
        } else {public_exercise.allowed = false;}
        if ( (req.user.user_id == exercise.author_id) || (req.user.groups.indexOf('Admin') > -1) ) {
          public_exercise.same_name_check = true;
        } else {public_exercise.same_name_check = false;}
      }
      if (public_exercise.allowed == true && (exercise.solution_id != null && exercise.solution_id != '')) {
        Solutions.findOne( { public_id: exercise.solution_id }, async function(err, solution) {
          if (err) {
            await db_my.tagList(req);
            res.render('exercises/details', {solution_error: 'ERROR: There was no solution found, but there should be one.',
                                            exercise: public_exercise, tagList: req.session.taglist});
          }
          public_solution = {
            png: solution.png,
            packages: solution.packages,
            code: solution.code,
            author: solution.author,
          }
          await db_my.tagList(req);
          res.render('exercises/details', {exercise: public_exercise, solution: public_solution, 
                                          tagList: req.session.taglist});
        })
      } else {
        if (exercise.solution_id == null || exercise.solution_id == '') {
          solution_unavailable = true;
        } else {solution_unavailable = false;}
        await db_my.tagList(req);
        res.render('exercises/details', {exercise: public_exercise, tagList: req.session.taglist,
                                          solution_unavailable: solution_unavailable});
      }
    }
  });
});


router.post('/edit_details', function(req,res,next) {
  Exercises.findOne( { public_id: req.body.hidden_id }, async function(err, exercise) {
    if (err) res.render('exercises/details', {exercise_error: 'ERROR: Exercise not found!'});
    else {
      public_exercise = {
        public_id: 'id/'+exercise.public_id,
        name: exercise.name,
        png: exercise.png,
        packages: exercise.packages,
        code: exercise.code,
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
  hidden_id = req.body.hidden_id.slice(3);
  Exercises.findOne( { public_id: hidden_id }, function(err, db_exercise) {
    if (err) throw err;
    if (db_exercise.solution_id) {
      Solutions.deleteOne( {public_id: db_exercise.solution_id}, function(solerr, db_solution) {
        if (solerr) throw solerr;
      });
    }
    Exercises.deleteOne( { public_id: hidden_id }, function(err, deleted_element){
      if (err) throw err;
      res.render('exercises/delete_successful', {deleted_exercise_name: deleted_element.name});
    })
  });
});





module.exports = router;