import passport from 'passport';
import OAuth2Strategy from 'passport-oauth2';
import request from 'request';
import qs from 'querystring';
import {Router} from 'express';
import {JSONFilePreset} from 'lowdb/node';
import {deriveKey, mac, encrypt, decrypt} from '../services/crypto.js';


// that is demo project, so we are just deriving new keys. But you want something more mature
// https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html#separation-of-keys-and-data
const hashKey = deriveKey('citizen id hashing key');
const encryptionKey = deriveKey('personal data encryption key');

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
  // OAuth2 is done, let's fetch citizen data now, ttl is 1m
  // scope is what we are requesting from the resource service
  let options = {
    url: `${process.env.KARKTA_USER_INFO}?${qs.stringify({scope: params.scope})}`,
    headers: {'Authorization': accessToken}
  };
  console.log(`Going to fetch user using GET request to ${JSON.stringify(options)}`); // SENSITIVE: will print your accessToken!!!
  request.get(options, function (error, response, bodyString) { // this Kartka backend call may happen in some of your services
    if (error) {
      console.log('Error occurred: ', error);
      return callback(error);
    }
    if (response.statusCode !== 200) {
      console.log(`Error occurred: ${response.statusCode}, response body: ${bodyString}`);
      return callback(new Error(`Got ${response.statusCode} response.`))
    }

    // we are asking for `subject.persona.clientKartkaId subject.nameBy.firstName`, so the RS will be like
    // {"subject":{"persona":{"clientKartkaId":"41414141-4141-4141-4141-414141414141"},"nameBy":{"firstName":"АЛЯКСАНДР"}}}
    console.log(`Got claims: ${bodyString}`); // SENSITIVE: will print personal data!!!
    const subject = JSON.parse(bodyString).subject;

    // 1) in the real life scenario you may want to use this secret as KEK to encrypt randomly generated DEKs,
    // store encrypted DEKs in the DB, and do HMAC, KMAC, Argon2, or whatever you prefer using DEKs.
    // 2) you may also add some Argon2, PBKDF2, BCrypt, .... hardening here, but it won't provide much security because all ids from
    // Kartka are unique UUIDv4 (122 bits of entropy), so even bruteforce of sha256(kartkaId) is impractical.
    // 3) if your DB will be leaked then citizenHash won't be de-hashed back to UUIDs (that's why you are hashing UUIDs),
    // won't be correlated with hashes from other leaked DBs (that's why you hash UUIDs with some static random nonce),
    // and won't even be correlated even with leaked source UUIDs (that's why you keep your nonce secret).
    // 4) do not keep this secret in the same place where you store your DB credentials, otherwise it will be leaked together with DB.
    const citizenHash = mac(subject.persona.clientKartkaId, hashKey)
    console.log(`Citizen ${citizenHash} has successfully logged in!`);
    return callback(null, {hash: citizenHash, name: subject.nameBy.firstName});
  })
}));

// put it to your repository level with the read DB and real queries
const db = await JSONFilePreset('db/db.json', {citizens: {}});
passport.serializeUser(async function (newCitizen, done) {
  // you can map citizen.hash to Int64 citizen.id somewhere here
  console.log(`Serializing citizen: ${newCitizen.hash}`);
  await db.update(({citizens}) => citizens[newCitizen.hash] = encrypt(newCitizen, encryptionKey));
  done(null, newCitizen.hash);
});

passport.deserializeUser(async function (hash, done) {
  console.log(`Deserializing citizen: ${hash}`);
  const blob = db.data.citizens[hash];
  if (!blob) {
    console.log(`Citizen not found: ${hash}`);
    done('my error')
  } else {
    let citizen = decrypt(blob);
    console.log(`Found citizen: ${citizen}`);
    done(null, citizen);
  }
});

const router = new Router();
router.use(passport.initialize());
router.use(passport.session());


router.get('/', passport.authenticate('oauth2'));

router.get('/callback',
  passport.authenticate('oauth2', {
    successRedirect: '/',
    failureRedirect: '/login/error'
  })
);

export default router;

