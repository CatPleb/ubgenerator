var express = require('express');
var router = express.Router();


/* TODO!!! Verification of user input to defend against possible attacks */


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {title: 'WIP exercise website'});
});

/* Miscellaneous */
router.get('/about', function(req, res, next) {
  res.render('about');
});

router.get('/contact', function(req, res, next) {
  res.render('contact');
});

module.exports = router;