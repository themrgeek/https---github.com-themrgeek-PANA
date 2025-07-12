const fs = require('fs');
const path = './chain.json';

function readDatabase() {
  if (!fs.existsSync(path)) return {};
  return JSON.parse(fs.readFileSync(path));
}

function writeDatabase(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

module.exports = { readDatabase, writeDatabase };
// The Blockchain class manages the chain of blocks, including methods for mining and adding transactions.
// It reads and writes the blockchain data to a JSON file for persistence.