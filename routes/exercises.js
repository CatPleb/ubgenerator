var express = require('express');
var router = express.Router();

var my = require('../lib/my modules/compile_code');
var db_my = require('../lib/my modules/database_helper_functions');

/* Mongoose models */
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
        all_packages: '\\usepackage[utf8]{inputenc}\n'
                      +'\\usepackage{amsmath}\n'
                      +'\\usepackage{amsthm}\n'
                      +'\\usepackage{amssymb}\n'
                      +'\\usepackage[ngerman]{babel}\n'
                      +exercise.packages,
        unique_packages: exercise.packages,
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
      if (public_exercise.allowed == true && exercise.solution_id != null) {
        Solutions.findOne( { public_id: exercise.solution_id }, async function(err, solution) {
          if (err) {
            await db_my.tagList(req);
            res.render('exercises/details', {solution_error: 'ERROR: There was no solution found, but there should be one. MESSAGE: '+err,
                                            exercise: public_exercise, tagList: req.session.taglist,});
          }
          public_solution = {
            png: solution.png,
            all_packages: '\\usepackage[utf8]{inputenc}\n'
                          +'\\usepackage{amsmath}\n'
                          +'\\usepackage{amsthm}\n'
                          +'\\usepackage{amssymb}\n'
                          +'\\usepackage[ngerman]{babel}\n'
                          +solution.packages,
            unique_packages: solution.packages,
            code: solution.code,
            author: solution.author,
          }
          //await db_my.tagList(req);
          res.render('exercises/details', {exercise: public_exercise, solution: public_solution,
                                          compile_error: req.session.compile_error,});
          req.session.compile_error = null;
        })
      } else {
        if (exercise.solution_id == null) {
          solution_unavailable = true;
        } else {solution_unavailable = false;}
        //await db_my.tagList(req);
        res.render('exercises/details', {exercise: public_exercise, solution_unavailable: solution_unavailable});
      }
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
      if (exercise.solution_id != null) {
        Solutions.findOne( { public_id: exercise.solution_id }, async function(err, solution) {
          if (err) {
            await db_my.tagList(req);
            res.render('exercises/details', {solution_error: 'ERROR: There was no solution found, but there should be one. MESSAGE: '+err,
                                            exercise: public_exercise, taglist: req.session.taglist});
          }
          public_solution = {
            png: solution.png,
            packages: solution.packages,
            code: solution.code,
            author: solution.author,
            public_id: solution.public_id,
          }
          await db_my.tagList(req);
          res.render('exercises/edit_details', {exercise: public_exercise, solution: public_solution, 
                                                taglist: req.session.taglist});
        })
      } else {
        await db_my.tagList(req);
        res.render('exercises/edit_details', {exercise: public_exercise, taglist: req.session.taglist});
      }
    }
  });
});

router.post('/redirect_back', function(req,res,next) {
  res.redirect('/exercises/id/'+req.body.hidden_id);
});


router.post('/change_tags', async function(req,res,next) {
  var changing_exercise = await Exercises.findOne({ public_id: req.body.hidden_id });
  changing_exercise.tags = my.convert2array(req.body.changing_tags);
  changing_exercise.save((err) => {
    if (err) throw err;
    res.redirect('/exercises/id/'+req.body.hidden_id);
  });
});


router.post('/change_exercise', function(req,res,next) {
  Exercises.findOne( { public_id: req.body.hidden_id }, function(err, db_exercise) {
    if (err) {
      req.session.compile_error = 'Something went wrong.';
      res.redirect('/exercises/id/'+req.body.hidden_id);
    }
    db_exercise.packages = req.body.changed_packages;
    db_exercise.code = req.body.changed_code;
    my.final_compile(req.body.changed_packages,req.body.changed_code, function(final_compile_error, base64png) {
      if (final_compile_error) {
        req.session.compile_error = 'ERROR while compiling changed code:<br>Message: '+final_compile_error;
        res.redirect('/exercises/id/'+req.body.hidden_id);
      } else {
        //console.log(util.inspect(req.body.exercise_latexcode, false, null, true))
        db_exercise.png = base64png;

        db_exercise.save((err) => {
          if (err) {
            req.session.compile_error = 'Something went wrong when saving changes. Maybe try again.';
            res.redirect('/exercises/id/'+req.body.hidden_id);
          }
          req.session.compile_error = 'Changes saved!';
          res.redirect('/exercises/id/'+req.body.hidden_id);
        });
      }
    });
  });
});


router.post('/change_solution', function(req,res,next) {
  Solutions.findOne( { public_id: req.body.hidden_solution_id }, function(err, db_solution) {
    if (err) {
      req.session.compile_error = 'Something went wrong.';
      res.redirect('/exercises/id/'+req.body.hidden_id);
    }
    db_solution.packages = req.body.changed_packages;
    db_solution.code = req.body.changed_code;
    my.final_compile(req.body.changed_packages,req.body.changed_code, function(final_compile_error, base64png) {
      if (final_compile_error) {
        req.session.compile_error = 'ERROR while compiling changed code:<br>Message: '+final_compile_error;
        res.redirect('/exercises/id/'+req.body.hidden_id);
      } else {
        //console.log(util.inspect(req.body.exercise_latexcode, false, null, true))
        db_solution.png = base64png;

        db_solution.save((err) => {
          if (err) {
            req.session.compile_error = 'Something went wrong when saving changes. Maybe try again.';
            res.redirect('/exercises/id/'+req.body.hidden_id);
          }
          req.session.compile_error = 'Changes saved!';
          res.redirect('/exercises/id/'+req.body.hidden_exercise_id);
        });
      }
    });
  });
});


router.post('/delete', function(req, res, next) {
  Exercises.findOne( { public_id: req.body.hidden_id }, function(err, db_exercise) {
    if (err) throw err;
    if (db_exercise.solution_id) {
      Solutions.deleteOne( {public_id: db_exercise.solution_id}, function(solerr, db_solution) {
        if (solerr) throw solerr;
      });
    }
    Exercises.deleteOne( { public_id: req.body.hidden_id }, function(err, deleted_element){
      if (err) throw err;
      res.render('exercises/delete_successful', {deleted_exercise_name: deleted_element.name});
    })
  });
});





module.exports = router;