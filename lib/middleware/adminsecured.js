module.exports = function () {
  return function secured (req, res, next) {
    if (req.user.groups.indexOf('Admin') >= 0) {
      return next();
    } else if (req.user) {
      res.redirect('/');
    }
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
  };
};