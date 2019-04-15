var express = require('express');
var router = express.Router();
var tmp = require('tmp');
tmp.setGracefulCleanup();
var fs = require('fs');
var shortid = require('shortid');

var my = require('../lib/my modules/compile_code');

/* Mongoose stuff and models */
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOOSE_ADDRESSE, {useNewUrlParser: true});

var Exercises = require('../lib/models/exercises_model');
var Hierarchy = require('../lib/models/hierarchy_model');

// my functions
var my = require('../lib/my modules/compile_code');
var secured = require('../lib/middleware/secured');



/* Create exercise pages */
router.get('/', secured(), function(req, res, next) {
  res.render('create/create');
});


/* post page for real time compiling */
router.post('/compile', secured(), function(req, res, next) {

  my.final_compile(req.body.packages,req.body.latexcode, function(final_compile_error, base64png) {
    if (final_compile_error) {
      res.send({err: final_compile_error});
    } else {
      res.send({res: base64png});
    }
  });
});


/* Confirmation query for newly created exercises */
router.post('/confirmation', secured(), function(req, res, next) {
  
  my.final_compile(req.body.packages, req.body.latexcode, function(final_compile_error, base64png) {
    if (final_compile_error) {
      res.render('create/nosuccess', {error: 'Error: That exercise might already exist.', exercise_name: 'ERROR; DONT RETRY', png: 'NONE', tag: 'NONE'});
    } else {
      Hierarchy.find().then(function(doc) {
        res.render('create/confirmation', {hierarchy: doc, packages: req.body.packages,
          latexcode: req.body.latexcode, png: base64png, create_error: req.session.create_error});
      });
    }
  });
});


/* try to write new exercise into database */
router.post('/engrave', secured(), function(req, res, next) {
  var exercise_name = req.body.exercise_name;
  var base64png = req.body.png_string;
  var extag = my.convert2array(req.body.tagselect);
  var packages = req.body.packages;
  var latexcode = req.body.latexcode;

  Exercises.findOne({name: exercise_name, png: base64png}, function(err, duplicate) {
    if (err || duplicate) {
      res.render('create/nosuccess', {error: 'ERROR: That exercise already exists.', exercise_name: exercise_name, png: base64png, tag: extag});
    } else {
      Hierarchy.findOne({name: extag}, function(tag_error, doc) {
        if (tag_error) {
          res.render('create/nosuccess', {error: tag_error, exercise_name: exercise_name, png: base64png, tag: extag});
        } else {
          var exercise = {                  // EXERCISE MODEL DEFINITION; CHANGE IF MODEL/SCHEMA CHANGED!!!
            public_id: shortid.generate(),
            name: exercise_name,
            packages: packages,
            code: latexcode,
            png: base64png,
            author: req.user.nickname,
            tags: extag, //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          };
        
          var data = new Exercises(exercise);
          data.save(function (err, saveddata) {
            if (err) {
              res.render('create/nosuccess', {error: err.message, exercise_name: exercise_name, png: base64png, tag: extag});
            }
            Exercises.findById(saveddata._id, function(err, exercise) {           //when getting >>TypeError: Cannot read property '_id' of undefined<< var exercise 15 lines ahead does not fit into database schema
              res.render('create/success', {exercise_name: exercise.name, png: exercise.png, tags: exercise.tags});
            }).catch(findByIdError => {
              console.log(findByIdError);
              res.render('create/nosuccess', {error: findByIdError, exercise_name: 'Database Exercise Schema Error, please tell admin! (preferably with what exactly you did)'});
            });
          });
        }
      });
    }
  });
});






module.exports = router;