require('dotenv').config()
const express = require('express');
const session = require('express-session')
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const indexRouter = require('./routes/index');
const loginRouter = require('./routes/kartka-login');
const errorRouter = require('./routes/error');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(session({
  secret: process.env.COOKIE_SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {secure: false, httpOnly: true}
}))
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// here is all  the logic
app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use(errorRouter);

module.exports = app;
