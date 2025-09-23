import {createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes} from 'crypto';

const hashAlgorithm = 'sha3-256'; // will use kmac to derive keys
const encAlgorithm = 'chacha20-poly1305';
const keyLen = 32;
const ivLen = 12;
const masterKey = process.env.MASTER_KEY;

export function deriveKey(context) {
  const derivedKey = hkdfSync(hashAlgorithm, masterKey, 'saltysalt', context, keyLen);
  return Buffer.from(derivedKey).toString('base64');
}

export function mac(message, secret) {
  return createHmac(hashAlgorithm, secret)
    .update(message)
    .digest('base64')
}

export function encrypt(message, key) {
  const plainText = JSON.stringify(message)
  const iv = randomBytes(ivLen)
  const cipher = createCipheriv(encAlgorithm, Buffer.from(key, 'base64'), iv);

  let cipherText = cipher.update(plainText, 'utf-8');
  cipherText = Buffer.concat([cipherText, cipher.final()])

  return {
    iv: iv.toString('base64'),
    cipher: cipherText.toString('base64'),
    tag: cipher.getAuthTag().toString('base64')
  };
}

export function decrypt(blob, secret) {
  const decipher = createDecipheriv(encAlgorithm, Buffer.from(secret, 'base64'), Buffer.from(blob.iv, 'base64'))

  decipher.setAuthTag(Buffer.from(blob.tag, 'base64'));
  let plainText = decipher.update(Buffer.from(blob.cipher, 'base64'));
  plainText = Buffer.concat([plainText, decipher.final()])

  return JSON.parse(plainText.toString('utf8'));
}

// try {
//   const key = deriveKey('testtest')
//   console.log(mac('asdasd', key))
//   const blob = encrypt({text: 'hello world', id: 123}, key);
//   const obj = decrypt(blob, key)
//   console.log(obj)
//   console.log(JSON.stringify(obj));
// } catch (error) {
//   console.error(error)
// }
