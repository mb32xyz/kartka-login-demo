import {JSONFilePreset} from 'lowdb/node';
import {deriveKey, mac, encrypt, decrypt} from './crypto-service.js';
import { randomUUID } from 'crypto';

// put it to your repository level with the read DB and real queries
const db = await JSONFilePreset('db/db.json', {citizens: {}, kartkaHashes: {}});
// that is demo project, so we are just deriving new keys. But you want something more mature
// https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html#separation-of-keys-and-data
const encryptionKey = deriveKey('personal data encryption key');
const hashKey = deriveKey('citizen id hashing key');

export function buildCitizen(kartkaUUID, name) {
  return {
    kartkaHash: mac(kartkaUUID, hashKey),
    name
  }
}

export async function persistCitizen(citizen, cb) {
  console.log(`Persisting citizen: ${citizen.kartkaHash}`);
  // mapping hashes to id, to abstract this service from exact auth provider
  let id = db.data.kartkaHashes[citizen.kartkaHash]
  if (id === null || id === undefined) {
    id = randomUUID();
    await db.update( ({kartkaHashes}) => { kartkaHashes[citizen.kartkaHash] = id });
    console.log(`Added new mapping ${citizen.kartkaHash} to ${id}`);
  }
  citizen.id = id

  await db.update(({citizens}) => citizens[citizen.id] = encrypt(citizen, encryptionKey)); // encrypt personal data (nameBy)
  cb(null, citizen.id);
}

export async function loadCitizen(id, cb) {
  console.log(`Loading citizen: ${id}`);
  const blob = db.data.citizens[id];
  if (!blob) {
    console.log(`Citizen not found: ${id}`);
    cb('my error here')
  } else {
    cb(null, decrypt(blob, encryptionKey));
  }
}