const fs = require('fs');
const https = require('https');
const http = require('http');
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

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

// Load SSL cert and key — replace with your cert files!
const privateKey = fs.readFileSync('./certs/private.pem', 'utf8');
const certificate = fs.readFileSync('./certs/certificate.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// Initialize blockchain
const panaBlockchain = new Blockchain();

// Wallet creation endpoint
app.post('/wallet/create', (req, res) => {
  const wallet = new Wallet();
  console.log(`New wallet created: ${wallet.getAddress()}`);
  res.json({
    address: wallet.getAddress(),
    privateKey: wallet.getPrivateKey()
  });
});

// Get balance endpoint
app.get('/wallet/balance/:address', (req, res) => {
  try {
    const balance = panaBlockchain.getBalance(req.params.address);
    res.json({ balance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create and send transaction endpoint
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

// Mining endpoint (support both URL param and request body)
app.post(['/mine', '/mine/:minerAddress'], (req, res) => {
  try {
    // Use param if provided, else take from body
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

// Get full chain endpoint
app.get('/chain', (req, res) => {
  res.json(panaBlockchain.chain);
});

// Generate QR code for address
app.get('/wallet/qrcode/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const qrDataUrl = await QRCode.toDataURL(address);
    res.json({ qrDataUrl });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start HTTPS server
const httpsServer = https.createServer(credentials, app);
const httpServer = http.createServer(app);
const HTTPS_PORT = 4433;
const HTTP_PORT = 8080;

httpsServer.listen(HTTPS_PORT, () => {
  console.log(`HTTPS Server listening on port ${HTTPS_PORT}`);
});
httpServer.listen(HTTP_PORT, () => {
  console.log(`HTTP Server listening on port ${HTTP_PORT}`);
});
