import request from 'request';
import qs from 'querystring';
import { buildCitizen } from './citizen-repository.js';

export function retrieveClaims(accessToken, scope, callback) {
  // OAuth2 is done, let's fetch citizen data now, ttl is 1m
  // scope is what we are requesting from the resource service
  let options = {
    url: `${process.env.KARKTA_USER_INFO}?${qs.stringify({scope: scope})}`,
    headers: {'Authorization': accessToken}
  };
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
    // console.log(`Got claims: ${bodyString}`); // SENSITIVE: will print personal data!!!
    const subject = JSON.parse(bodyString).subject;

    // 1) in the real life scenario you may want to use this secret as KEK to encrypt randomly generated DEKs,
    // store encrypted DEKs in the DB, and do HMAC, KMAC, Argon2, or whatever you prefer using DEKs.
    // 2) you may also add some Argon2, PBKDF2, BCrypt, .... hardening here, but it won't provide much security because all ids from
    // Kartka are unique UUIDv4 (122 bits of entropy), so even bruteforce of sha256(kartkaId) is impractical.
    // 3) if your DB will be leaked then citizenHash won't be de-hashed back to UUIDs (that's why you are hashing UUIDs),
    // won't be correlated with hashes from other leaked DBs (that's why you hash UUIDs with some static random nonce),
    // and won't even be correlated even with leaked source UUIDs (that's why you keep your nonce secret).
    // 4) do not keep this secret in the same place where you store your DB credentials, otherwise it will be leaked together with DB.
    // const kartkaHash =
    const citizen = buildCitizen(subject.persona.clientKartkaId, subject.nameBy.firstName);
    console.log(`Citizen ${citizen.kartkaHash} has successfully logged in!`);
    return callback(null, citizen);
  })
}