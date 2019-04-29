module.exports = function () {
  return function secured (req, res, next) {
    if (!req.user) {
      req.session.returnTo = req.originalUrl;
      res.redirect('/login');
      return;
    } else if (req.user.groups.indexOf('Allowed') >= 0) {
      return next();
    }
    res.redirect('/');
  };
};