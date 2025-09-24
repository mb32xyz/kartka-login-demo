import passport from 'passport';
import OAuth2Strategy from 'passport-oauth2';

import {Router} from 'express';
import {loadCitizen, persistCitizen} from '../services/citizen-repository.js'
import {retrieveClaims} from "../services/kauth-service.js";


// here we are initing our kartka client
passport.use(new OAuth2Strategy({
  authorizationURL: process.env.OAUTH2_AUTH_URL,
  tokenURL: process.env.OAUTH2_TOKEN_URL,
  clientID: process.env.OAUTH2_CLIENT_ID,
  clientSecret: process.env.OAUTH2_CLIENT_SECRET,
  callbackURL: process.env.OAUTH2_CALLBACK_URL,
  grantType: process.env.OAUTH2_CLIENT_GRANT_TYPE,
  tokenEndpointAuthMethod: process.env.OAUTH2_CLIENT_TOKEN_ENDPOINT,
  scope: process.env.OAUTH2_CLIENT_SCOPE, // the set of scopes your app will be requesting. It should be "non-superset" of scopes your client have access to.
  state: true
}, function (accessToken, refreshToken, params, profile, callback) {
  retrieveClaims(accessToken, params.scope, callback);
}));


passport.serializeUser(async function (citizen, done) {
  await persistCitizen(citizen, done);
});

passport.deserializeUser(async function (id, done) {
  await loadCitizen(id, done);
});

const router = new Router();
router.use(passport.initialize());
router.use(passport.session());


router.get('/', passport.authenticate('oauth2'));

router.get('/error', (req, res) => {
  const errorCode = req.query.errorCode || '';
  const error = req.query.error || 'no-error';
  const errorDescription = req.query.errorDescription || '';

  res.render('kauth-error', {
    title: 'Памылка аўтарызацыі',
    errorCode,
    error,
    errorDescription
  });
});

router.get('/callback', (req, res, cb) => {
    if (req.query.code) {
      passport.authenticate('oauth2', {
        successRedirect: '/',
        failureRedirect: '/error'
      })(req, res, cb);
    } else {
      const query = new URLSearchParams(req.query);
      res.redirect('/login/error?' + query.toString());
    }
  }
);

export default router;

