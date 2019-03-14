var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var expressSession = require('express-session');

// Load environment variables from .env
var dotenv = require('dotenv');
var result = dotenv.config();
if (result.error) {
  throw result.error;
}
console.log(result.parsed);

if (!(process.env.OPERATING_SYSTEM == ('windows' || 'linux'))) {
  throw new Error('CHANGE OPERATING_SYSTEM IN .env FILE TO YOUR OS.');
}

// Load Passport
var passport = require('passport');
var Auth0Strategy = require('passport-auth0');


// Configure Passport to use Auth0
var strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL:
      process.env.AUTH0_CALLBACK_URL || 'http://localhost:8000/callback'
  },
  function (accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  }
);

// passport.use stuff
passport.use(strategy);

// You can use this section to keep a smaller payload (ie. only serialize user.id for token)
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});


var indexRouter = require('./routes/index');
var createRouter = require('./routes/create');
var searchRouter = require('./routes/search');
var exercisesRouter = require('./routes/exercises');
var authRouter = require('./routes/auth');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var userInViews = require('./lib/middleware/userInViews');


var app = express();
var hbs = exphbs.create({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'});

// view engine setup
app.engine('hbs', hbs.engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// config express-session
var sess = {
  secret: 'alldayeveryday123',
  cookie: {},
  resave: false,
  saveUninitialized: true
};
if (app.get('env') === 'production') {
  sess.cookie.secure = true; // serve secure cookies, requires https
}

app.use(expressSession(sess));
app.use(passport.initialize());
app.use(passport.session());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(userInViews());
app.use('/', indexRouter);
app.use('/create', createRouter);
app.use('/search', searchRouter);
app.use('/exercises', exercisesRouter);
app.use('/', authRouter);
app.use('/', indexRouter);
app.use('/', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
