var express = require('express');
var router = express.Router();

/* Mongoose stuff and models */
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOOSE_ADDRESSE);

var Exercises = require('../lib/models/exercises_model');
var Hierarchy = require('../lib/models/hierarchy_model');



/* detailed exercise page */
router.get('/', function(req, res, next) {
  res.render('exercises/details');
});


router.get('/id/:exercise_id', function(req, res, next) {
  Exercises.findOne( { public_id: req.params.exercise_id }, function(err, exercise) {
    if (err) res.render('exercises/details', {exercise_error: 'ERROR: Exercise not found!'});
    else {
      public_exercise = {
        public_id: exercise.public_id,
        name: exercise.name,
        png: exercise.png,
        tag: exercise.tag,
      };
      res.render('exercises/details', {exercise: public_exercise});
    }
  });
});


router.post('/delete', function(req, res, next) {
  Exercises.findOneAndDelete( { public_id: req.body.hidden_id }, function(err, deleted_element){
    if (err) throw err
    res.render('exercises/delete_successful', {deleted_exercise_name: deleted_element.name});
  })
});





module.exports = router;