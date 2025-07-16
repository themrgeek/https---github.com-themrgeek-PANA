const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const cors = require('cors');

const Blockchain = require('./blockchain/Blockchain');
const Transaction = require('./blockchain/transaction');
const Wallet = require('./wallet/wallet');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

// Initialize blockchain
const panaBlockchain = new Blockchain();

// Create wallet
app.post('/wallet/create', (req, res) => {
  const wallet = new Wallet();
  res.json({
    address: wallet.getAddress(),
    privateKey: wallet.getPrivateKey()
  });
});

// Get balance
app.get('/wallet/balance/:address', (req, res) => {
  try {
    const balance = panaBlockchain.getBalance(req.params.address);
    res.json({ balance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Send transaction
app.post('/transaction/send', (req, res) => {
  try {
    const { fromAddress, toAddress, amount, privateKey } = req.body;
    if (!fromAddress || !toAddress || !amount || !privateKey) {
      throw new Error('Missing transaction parameters');
    }

    const EC = require('elliptic').ec;
    const ec = new EC('secp256k1');
    const key = ec.keyFromPrivate(privateKey);

    const tx = new Transaction(fromAddress, toAddress, amount);
    tx.signTransaction(key);
    panaBlockchain.addTransaction(tx);

    res.json({ message: 'Transaction added to pending transactions' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mine block
app.post(['/mine', '/mine/:minerAddress'], (req, res) => {
  try {
    const minerAddress = req.params.minerAddress || req.body.minerAddress;
    if (!minerAddress) {
      throw new Error('Miner address is required');
    }

    panaBlockchain.minePendingTransactions(minerAddress);

    res.json({
      message: 'Block mined successfully',
      chain: panaBlockchain.chain
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get chain
app.get('/chain', (req, res) => {
  res.json(panaBlockchain.chain);
});

// QR Code
app.get('/wallet/qrcode/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const qrDataUrl = await QRCode.toDataURL(address);
    res.json({ qrDataUrl });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start server on dynamic port for Render
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
