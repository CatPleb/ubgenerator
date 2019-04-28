var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
// WHEN CHANGING SCHEMA; CTRL+F FOR "EXERCISE MODEL" IN CREATE.JS (AND SEARCH.JS) AND CHANGE ACCORDINGLY
var solutionsSchema = new Schema({
  public_id: {type: String, required: true},
  related_exercise_public_id: {type: String, required: true},
  code: {type: String, required: true},
  packages: {type: String},
  png: {type: String, required: true},
  language: {type: String, required: true, enum: ['English', 'Deutsch'], default: 'Deutsch' },
  author: {type: String, required: true},
  author_id: {type: String, required: true},
  time_of_changes: String,
  attachments: String,
  tags: [String],
  tag_lecture: String,
  tag_academic_level: String,
  id_of_different_language: String,
  comments: [String],
  rating_quality: Number, 
  rating_difficulty: Number,
}, {collection: 'solutions'});

module.exports = mongoose.model('Solutions', solutionsSchema);