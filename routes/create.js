var express = require('express');
var router = express.Router();
var tmp = require('tmp');
tmp.setGracefulCleanup();
var fs = require('fs');
var shortid = require('shortid');

var my = require('../lib/my modules/compile_code');
var db_my = require('../lib/my modules/database_helper_functions');


/* Mongoose stuff and models */
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOOSE_ADDRESSE, {useNewUrlParser: true});

var Exercises = require('../lib/models/exercises_model');
var Solutions = require('../lib/models/solutions_model');

// my functions
var my = require('../lib/my modules/compile_code');
var allowed_secured = require('../lib/middleware/allowed_secured');



/* Create exercise pages */
router.get('/', allowed_secured(), async function(req, res, next) {
  await db_my.tagList(req);

  res.render('create/create', { taglist: req.session.taglist });
});


/* post page for real time compiling for the exercise */
router.post('/exercise_compile', allowed_secured(), function(req, res, next) {

  my.final_compile(req.body.exercise_packages,req.body.exercise_latexcode, function(final_compile_error, base64png) {
    if (final_compile_error) {
      res.send({err: final_compile_error});
    } else {
      res.send({res: base64png});
    }
  });
});


/* post page for real time compiling for the solution */
router.post('/solution_compile', allowed_secured(), function(req, res, next) {

  my.final_compile(req.body.solution_packages,req.body.solution_latexcode, function(final_compile_error, base64png) {
    if (final_compile_error) {
      res.send({err: final_compile_error});
    } else {
      res.send({res: base64png});
    }
  });
});


/* Confirmation query for newly created exercises */
router.post('/confirmation', allowed_secured(), function(req, res, next) {
  
  my.final_compile(req.body.exercise_packages, req.body.exercise_latexcode, function(final_compile_error_1, exercise_base64png) {
    if (final_compile_error_1) {
      res.render('create/nosuccess', {error: 'Error: That exercise might already exist.',
        exercise_name: 'ERROR; DONT RETRY', png: 'NONE', tag: 'NONE'});
    } else {

      if (req.body.solution_latexcode) { // if there is a solution confirm both
        my.final_compile(req.body.solution_packages, req.body.solution_latexcode, function(final_compile_error_2, solution_base64png) {
          if (final_compile_error_2) {
            res.render('create/nosuccess', {error: 'Error: Compiling solution failed.', exercise_name: 'ERROR; DONT RETRY',
              png: 'NONE', tag: 'NONE'});
          } else {
            res.render('create/confirmation', {tags: my.convert2array(req.body.selected_tags), exercise_packages: req.body.exercise_packages,
              exercise_latexcode: req.body.exercise_latexcode, exercise_png: exercise_base64png,
              solution_packages: req.body.solution_packages, solution_latexcode: req.body.solution_latexcode,
              solution_png: solution_base64png, });
          }
        });
      } else { // if no solution only confirm the exercise
        res.render('create/confirmation', {tags: my.convert2array(req.body.selected_tags), exercise_packages: req.body.exercise_packages,
          exercise_latexcode: req.body.exercise_latexcode, exercise_png: exercise_base64png});
      }
    }
  });
});


/* try to write new exercise into database */
router.post('/engrave', allowed_secured(), function(req, res, next) {
  var exercise_name = req.body.exercise_name;
  var extag = my.convert2array(req.body.tagselect);
  
  var exercise_base64png = req.body.exercise_png_string;
  var exercise_packages = req.body.exercise_packages;
  var exercise_latexcode = req.body.exercise_latexcode;

  var solution_base64png = req.body.solution_png_string;
  var solution_packages = req.body.solution_packages;
  var solution_latexcode = req.body.solution_latexcode;

  Exercises.findOne({name: exercise_name, png: exercise_base64png}, function(err, duplicate) {
    if (err || duplicate) {
      res.render('create/nosuccess', {error: 'ERROR: That exercise already exists.', exercise_name: exercise_name, png: exercise_base64png, tag: extag});
    } else {
      expid = shortid.generate();
      if (solution_latexcode) {
        solpid = [shortid.generate()];
      } else {
        solpid = undefined;
      }

      var exercise = {                  // EXERCISE MODEL DEFINITION; CHANGE IF MODEL/SCHEMA CHANGED!!!
        public_id: expid,
        related_solutions_public_ids: solpid,
        name: exercise_name,
        packages: exercise_packages,
        code: exercise_latexcode,
        png: exercise_base64png,
        author: req.user.nickname,
        author_id: req.user.user_id,
        tags: extag,
      };

      if (solution_latexcode) {
        var solution = {                  // SOLUTION MODEL DEFINITION; CHANGE IF MODEL/SCHEMA CHANGED!!
          public_id: solpid,
          related_exercise_public_id: expid,
          packages: solution_packages,
          code: solution_latexcode,
          png: solution_base64png,
          author: req.user.nickname,
          author_id: req.user.user_id,
        }
        var solution_data = new Solutions(solution);
      }
    
      var exercise_data = new Exercises(exercise);

      exercise_data.save(function (err, saveddata) {
        if (err) {
          res.render('create/nosuccess', {error: err.message, exercise_name: exercise_name, png: exercise_base64png, tag: extag});
        } else {
          Exercises.findById(saveddata._id, async function(err, exercise) {           //when getting >>TypeError: Cannot read property '_id' of undefined<< var exercise 15 lines ahead does not fit into database schema
            if (solution_data) {
              await solution_data.save();
              res.render('create/success', {exercise_name: exercise.name, exercise_png: exercise.png,
                solution_png: solution_data.png, tags: my.convert2array(exercise.tags)});
            } else {
              res.render('create/success', {exercise_name: exercise.name, exercise_png: exercise.png,
                tags: my.convert2array(exercise.tags)})
            }
          }).catch(findByIdError => {
            console.log(findByIdError);
            res.render('create/nosuccess', {error: findByIdError, exercise_name: 'Database Exercise Schema Error, please tell admin! (preferably with what exactly you did)'});
          });
        }
      });
    }
  });
});






module.exports = router;