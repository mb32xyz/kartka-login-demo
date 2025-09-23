import 'dotenv/config'
import express from 'express';
import session from 'express-session';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import indexRouter from './routes/index.js';
import loginRouter from './routes/kartka-login.js';
import errorRouter from './routes/error.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.COOKIE_SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  cookie: {secure: true, httpOnly: true}
}))
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));


// here is all  the logic
app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use(errorRouter);

export default app;
