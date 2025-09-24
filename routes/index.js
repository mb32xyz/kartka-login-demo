import {Router} from 'express';
import {loadCitizen} from '../services/citizen-repository.js';

const router = Router();

export default router.get('/', function (req, res, next) {
  const hash = req?.session?.passport?.user;
  if (!hash) {
    res.render('index', {
      name: '',
      loggedIn: false,
    });
  } else {
    loadCitizen(hash, (err, citizen) => {
      const readableName = citizen.name.toUpperCase().substring(0, 1) + citizen.name.toLocaleLowerCase().substring(1)
      res.render('index', {
        name: readableName,
        loggedIn: true
      })
    })
  }
});
