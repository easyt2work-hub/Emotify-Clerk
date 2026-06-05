const crypto = require('crypto');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
});

// Convert PEM to JWK format
const jwkPrivate = crypto.createPrivateKey(privateKey).export({ format: 'jwk' });
const jwkPublic = crypto.createPublicKey(publicKey).export({ format: 'jwk' });

// Add kid, alg, and use
jwkPublic.kid = "static-key-1";
jwkPublic.alg = "RS256";
jwkPublic.use = "sig";

jwkPrivate.kid = "static-key-1";
jwkPrivate.alg = "RS256";
jwkPrivate.use = "sig";

console.log(JSON.stringify({
  privateKeyJwk: jwkPrivate,
  publicKeyJwk: jwkPublic
}, null, 2));
