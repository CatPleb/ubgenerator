var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
// WHEN CHANGING SCHEMA; CTRL+F FOR "EXERCISE MODEL" IN CREATE.JS (AND SEARCH.JS) AND CHANGE ACCORDINGLY
var exercisesSchema = new Schema({
  public_id: {type: String, required: true},
  name: {type: String, required: true},
  code: {type: String, required: true},
  packages: {type: String, required: true},
  png: {type: String, required: true},
  language: {type: String, required: true, enum: ['English', 'Deutsch'], default: 'Deutsch' },
  author: {type: String},
  time_of_changes: String,
  attachments: String,
  tag: String,
  tag_id: String,
  tag_lecture: String,
  tag_academic_level: String,
  id_of_different_language: String,
  comments: [String],
  rating_quality: Number, 
  rating_difficulty: Number,
}, {collection: 'exercises'});

module.exports = mongoose.model('Exercises', exercisesSchema);