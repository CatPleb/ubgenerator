var express = require('express');
var router = express.Router();
var tmp = require('tmp');
tmp.setGracefulCleanup();
var fs = require('fs');
var shortid = require('shortid');

/* Mongoose stuff and models */
var mongoose = require('mongoose');
var materializedPlugin = require('mongoose-tree-materialized');
mongoose.connect('mongodb://localhost:27017/public');

var Exercises = require('../lib/models/exercises_model');
var Hierarchy = require('../lib/models/hierarchy_model');

// my functions
var my = require('../lib/middleware/compile_code');



/* Create exercise pages */
router.get('/', function(req, res, next) {
  res.render('create/create');
});


/* post page for real time compiling */
router.post('/compile', function(req, res, next) {

  my.final_compile(req.body.packages,req.body.latexcode, function(final_compile_error, base64png) {
    if (final_compile_error) {
      res.send({err: final_compile_error});
    } else {
      res.send({res: base64png});
    }
  });
});


/* Confirmation query for newly created exercises */
router.post('/confirmation', function(req, res, next) {
  my.final_compile(req.body.packages, req.body.latexcode, function(final_compile_error, base64png) {
    if (final_compile_error) {
      res.render('create/nosuccess', {error: 'Error: That exercise might already exist.', exercise_name: 'ERROR; DONT RETRY', png: 'NONE', tag: 'NONE'});
    } else {
      Hierarchy.find().then(function(doc) {
        res.render('create/confirmation', {hierarchy: doc, png: base64png, create_error: req.session.create_error});
      });
    }
  });
});


/* try to write new exercise into database */
router.post('/engrave', function(req, res, next) {
  var exercise_name = req.body.exercise_name;
  var base64png = req.body.png_string;
  var extag = req.body.tagselect;

  Exercises.findOne({name: exercise_name, png: base64png}, function(err, duplicate) {
    if (err || duplicate) {
      res.render('create/nosuccess', {error: 'Error: That exercise already exists.', exercise_name: exercise_name, png: base64png, tag: extag});
    } else {
      Hierarchy.findOne({tag: extag}, function(err, doc) {
        var exercise = {                  // EXERCISE MODEL DEFINITION; CHANGE IF MODEL/SCHEMA CHANGED!!!
          public_id: shortid.generate(),
          name: exercise_name,
          code: req.body.latexcode,
          packages: req.body.packages,
          png: base64png,
          tag: extag,
          tag_id: doc._id,
        };
      
        var data = new Exercises(exercise);
        data.save(function (err, saveddata) {
          if (err) {
            res.render('create/nosuccess', {error: err.message, exercise_name: exercise_name, png: base64png, tag: extag});
          }
          Exercises.findById(saveddata._id, function(err, exercise) {           //when getting >>TypeError: Cannot read property '_id' of undefined<< var exercise in line 100 does not fit into database schema
            res.render('create/success', {exercise_name: exercise.name, png: exercise.png, tag: exercise.tag});
          });
        });
      });
    }
  });
});






module.exports = router;