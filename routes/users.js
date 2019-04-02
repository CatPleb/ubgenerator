var express = require('express');
var secured = require('../lib/middleware/secured');
var router = express.Router();

/* GET user profile. */
router.get('/user', secured(), function (req, res, next) {
  const { _raw, _json, ...userProfile } = req.user;
  
  if (req.user.groups.indexOf('Admin') >= 0) {
    admin_check = true;
  } else {
    admin_check = false;
  }
  res.render('user/main', {
    userProfile: JSON.stringify(userProfile, null, 2),
    title: 'Profile page',
    admin: admin_check,
  });
});

module.exports = router;