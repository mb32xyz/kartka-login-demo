const express = require('express');
const passport = require('passport');
const oauth2Strategy = require('passport-oauth2');
const request = require('request');
const qs = require('querystring')
const router = express.Router();

// here we are initing our kartka client
passport.use(new oauth2Strategy({
  authorizationURL: process.env.OAUTH2_AUTH_URL,
  tokenURL: process.env.OAUTH2_TOKEN_URL,
  clientID: process.env.OAUTH2_CLIENT_ID,
  clientSecret: process.env.OAUTH2_CLIENT_SECRET,
  callbackURL: process.env.OAUTH2_CALLBACK_URL,
  grantType: process.env.OAUTH2_CLIENT_GRANT_TYPE,
  tokenEndpointAuthMethod: process.env.OAUTH2_CLIENT_TOKEN_ENDPOINT,
  scope: process.env.OAUTH2_CLIENT_SCOPE, // the set of scopes your app will be requesting. It should be "non-superset" of scopes your client have access to.
  state: true
}, function (accessToken, refreshToken, params, profile, done) {
  // finish callback
  console.log('Access Token: ' + accessToken); // access token is alive for 1minute
  console.log('Refresh Token: ' + refreshToken); // no refresh token is sent
  console.log('scope: ' + params.scope); // set of scopes that was in fact granted by citizen.
  // (may be a subset of the requested scope once Kartka will implement optional filed, e.g. kartkaId is mandatory, but real name is optional)
  console.log('token_type: ' + params.token_type);
  console.log('expires_in: ' + params.expires_in);
  console.log('done: ' + done);
  console.log('profile: ' + profile);

  // OAuth2 is done, let's fetch citizen data now, ttl is 1m
  // scope is what we are requesting from the resource service
  let options = {
    url: `${process.env.KARKTA_USER_INFO}?${qs.stringify({scope: params.scope})}`,
    headers: {'Authorization': accessToken} //
  };
  console.log(`Going to fetch user using GET request to ${JSON.stringify(options)}`);
  request.get(options, function (error, response, body) {
    if (error) {
      console.log('Error occurred: ', error);
      return done(error);
    }
    if(response.statusCode !== 200) {
      console.log(`Error occurred: ${response.statusCode}, response body: ${JSON.stringify(body)}`);
    }
    console.log(body);
    return done(null, body);
  })

}));

passport.serializeUser(function (user, done) {
  console.log('user serializeUser: ', user)
  done(null, user); // TODO
});
passport.deserializeUser(function (obj, done) {
  console.log('user deserializeUser: ', user);
  done(null, obj); // TODO
});

router.use(passport.initialize());
router.use(passport.session());


router.get('/', passport.authenticate('oauth2'));

router.get('/callback',
  passport.authenticate('oauth2', {
    successRedirect: '/',
    failureRedirect: '/failure'
  })
);

module.exports = router;

