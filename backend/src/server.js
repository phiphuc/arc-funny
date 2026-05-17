import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fetchArcData, fetchEthData, calculateScore, getTier, detectSybil } from './scoring.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Analyze wallet endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    console.log(`[Analyze] ${address}`);

    // Fetch data from both chains in parallel
    const [arcData, ethData] = await Promise.all([
      fetchArcData(address),
      fetchEthData(address)
    ]);

    // Calculate score
    const score = calculateScore(arcData, ethData);
    const tierInfo = getTier(score);
    const sybilInfo = detectSybil(arcData, ethData, score);

    const result = {
      address,
      score,
      tier: tierInfo.tier,
      tierName: tierInfo.name,
      tierEmoji: tierInfo.emoji,
      sybilRisk: sybilInfo.risk,
      sybilScore: sybilInfo.sybilScore,
      ethereum: {
        accountAge: ethData.accountAge,
        firstTxDate: ethData.firstTxDate,
        balance: ethData.ethBalance,
        txCount: ethData.txCount
      },
      arc: {
        txCount: arcData.txCount,
        tokenTransfers: arcData.tokenTransfers,
        balance: arcData.balance,
        isContract: arcData.isContract
      },
      timestamp: new Date().toISOString()
    };

    res.json(result);
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Mint NFT endpoint (placeholder - will integrate with contract)
app.post('/api/mint', async (req, res) => {
  try {
    const { address, score, tier } = req.body;

    if (!address || score === undefined || tier === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // TODO: Integrate with ProvableNFT contract
    // For now, return mock response
    res.json({
      success: true,
      message: 'NFT mint initiated',
      txHash: '0x' + '0'.repeat(64),
      address,
      score,
      tier
    });
  } catch (error) {
    console.error('Mint error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Provable API running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
