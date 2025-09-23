import createError from 'http-errors';
import {Router} from 'express';

const router = Router();

router.use(function (req, res, next) {
  next(createError(404));
});

router.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = err;

  res.status(err.status || 500);
  res.render('error');
});

export default router;