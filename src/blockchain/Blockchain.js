const Block = require('./Block');
const Transaction = require('./transaction');
const { readDatabase, writeDatabase } = require('../storage/db');

class Blockchain {
  constructor() {
    const db = readDatabase();
    if (db.chain) {
      this.chain = db.chain;
    } else {
      this.chain = [this.createGenesisBlock()];
      this.save();
    }
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100;
    this.spentTxHashes = new Set();
  }

  save() {
    writeDatabase({ chain: this.chain });
  }

  createGenesisBlock() {
    return new Block(0, Date.now().toString(), [], '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress) {
    // Reward transaction for miner
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
    this.pendingTransactions.push(rewardTx);

    const block = new Block(
      this.chain.length,
      Date.now().toString(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );
    block.mineBlock(this.difficulty);
    this.chain.push(block);

    // Clear pending tx and update spent tx hashes
    for (const tx of this.pendingTransactions) {
      this.spentTxHashes.add(tx.calculateHash());
    }
    this.pendingTransactions = [];
    this.save();
  }

  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) throw new Error('Transaction must include from and to address');
    if (!transaction.isValid()) throw new Error('Invalid transaction signature');

    const txHash = transaction.calculateHash();
    if (this.spentTxHashes.has(txHash)) {
      throw new Error('Double spending detected');
    }

    this.pendingTransactions.push(transaction);
  }

  getBalance(address) {
    let balance = 0;
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.fromAddress === address) {
          balance -= tx.amount;
        }
        if (tx.toAddress === address) {
          balance += tx.amount;
        }
      }
    }
    return balance;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (!current.transactions.every(tx => tx.isValid())) {
        return false;
      }

      if (current.hash !== current.calculateHash()) {
        return false;
      }

      if (current.previousHash !== previous.hash) {
        return false;
      }
    }
    return true;
  }
}

module.exports = Blockchain;
