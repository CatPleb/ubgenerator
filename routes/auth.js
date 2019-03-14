var express = require('express');
var router = express.Router();
var passport = require('passport');

var util = require('util');


router.get('/login', passport.authenticate('auth0', {
  scope: 'openid profile email',
}), function (req, res) {
  res.redirect('/');
});

// Perform the final stage of authentication and redirect to previously requested URL or '/user'
router.get('/callback', function (req, res, next) {
  passport.authenticate('auth0', function (err, user, info) {
    if (err) { return next(err);}
    if (!user) { return res.redirect('/login'); }
    req.logIn(user, function (err) {
      if (err) { return next(err); }
      user['groups'] = user['_json'][String('https://ubgenerator:eu:auth0:com/claims/groups')];
      //console.log(util.inspect(user, false, null, true));
      const returnTo = req.session.returnTo;
      delete req.session.returnTo;
      res.redirect(returnTo || '/user');
    });
  })(req, res, next);
});

// Perform session logout and redirect to homepage
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('https://' + process.env.AUTH0_DOMAIN+'/v2/logout?returnTo='+process.env.WEBSITE_DOMAIN);
});




module.exports = router;