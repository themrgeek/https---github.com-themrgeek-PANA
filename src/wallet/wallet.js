const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Wallet {
  constructor() {
    this.key = ec.genKeyPair();
  }

  getAddress() {
    return this.key.getPublic('hex');
  }

  getPrivateKey() {
    return this.key.getPrivate('hex');
  }

  getKeyPair() {
    return this.key;
  }
}

module.exports = Wallet;
// The Wallet class provides methods to generate a new wallet, retrieve the public address, and access the private key.