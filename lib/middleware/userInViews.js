module.exports = function () {
  return function (req, res, next) {
    //console.log(req.user);
    res.locals.user = req.user;
    next();
  };
};