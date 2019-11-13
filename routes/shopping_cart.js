var express = require('express');
var router = express.Router();
var Cart = require('../lib/models/cart');

var Exercises = require('../lib/models/exercises_model');



router.get('/add-to-cart/:id', function(req, res, next) {
  var exerciseId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  Exercises.findOne({public_id: exerciseId}, function(err, exercise) {
    if (err) throw err;
    check = cart.add(exercise, exercise.public_id);
    req.session.cart = cart;
    res.redirect('/search');
  });
});


router.get('/remove-from-cart/:id', function(req, res, next) {
  var exerciseId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  check = cart.remove(exerciseId);
  req.session.cart = cart;
  res.redirect('/shopping_cart');
});


router.get('/remove-all-from-cart', function(req, res, next) {
  req.session.cart = new Cart({});
  res.redirect('/shopping_cart');
});


router.get('/shopping_cart', async function(req,res,next) {
  if (!req.session.cart) {
    return res.render('shop/shopping_cart', {exercises: null});
  }
  var cart = new Cart(req.session.cart);
  res.render('shop/shopping_cart', {exercises: await cart.generateArray(), totalQty: cart.totalQty})
});

router.get('/create_latex_doc', async function(req,res,next) {
  if (!req.session.cart) {
    return res.redirect('shop/shopping_cart');
  }
  var cart = new Cart(req.session.cart);
  exercisesArray = await cart.generateArray();
  console.log(exercisesArray);
  packageString = '';
  codeString = '';
  for (i in exercisesArray) {
    packageString = packageString + '\n' + exercisesArray[i].packages
    codeString = codeString + '\n\n' + exercisesArray[i].code
    console.log(i, exercisesArray[i].packages);
    console.log(i, exercisesArray[i].code);
  }
  full_doc = '\\documentclass{article}\n' +
              '\\usepackage[utf8]{inputenc}\n' +
              '\\usepackage{amsmath}\n' +
              '\\usepackage{amsthm}\n' +
              '\\usepackage{amssymb}\n' +
              '\\usepackage[ngerman]{babel}' +
              packageString + '\n\n' +
              '\\begin{document}\n' +
              codeString + '\n\n' +
              '\\end{document}';
  console.log('fin:', full_doc);
  res.render('shop/create_latex_doc', {packages: packageString, code: codeString,
                                      full_doc: full_doc, totalQty: cart.totalQty});
});




module.exports = router;