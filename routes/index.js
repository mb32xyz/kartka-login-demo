import {Router} from 'express';

const router = Router();

export default router.get('/', function (req, res, next) {
  res.render('index');
});
