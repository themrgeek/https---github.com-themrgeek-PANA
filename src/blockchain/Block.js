const crypto = require('crypto');

class Block {
  constructor(index, timestamp, transactions, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto.createHash('sha256')
      .update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce)
      .digest('hex');
  }

  mineBlock(difficulty) {
    console.log(`⛏️ Mining block #${this.index}...`);
    const start = Date.now();
    const target = Array(difficulty + 1).join('0');

    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    const end = Date.now();
    const duration = ((end - start) / 1000).toFixed(2);
    const hashRate = Math.floor(this.nonce / (end - start) * 1000); // hashes/sec

    console.log(`✅ Block mined: ${this.hash}`);
    console.log(`⏱️ Time taken: ${duration}s`);
    console.log(`🔁 Nonce attempts: ${this.nonce}`);
    console.log(`⚡ Hash rate: ${hashRate} hashes/sec`);
  }
}

module.exports = Block;
