import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import {
  fetchArcData,
  fetchEthData,
  calculateScore,
  getTier,
  detectSybil
} from './scoring.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

function isAddress(value) {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'real-data',
    timestamp: new Date().toISOString(),
    arcscan: process.env.ARCSCAN_API_URL || 'https://testnet.arcscan.app/api/v2',
    ethRpc: process.env.ETH_RPC_URL || 'https://eth.llamarpc.com',
    etherscanConfigured: Boolean(process.env.ETHERSCAN_API_KEY)
  });
});

app.post('/api/analyze', async (req, res) => {
  const started = Date.now();
  const { address } = req.body || {};

  if (!isAddress(address)) {
    return res.status(400).json({ error: 'Invalid address' });
  }

  try {
    const checksumAddress = address;
    const [arcData, ethData] = await Promise.all([
      fetchArcData(checksumAddress),
      fetchEthData(checksumAddress)
    ]);

    const score = calculateScore(arcData, ethData);
    const tierInfo = getTier(score);
    const sybilInfo = detectSybil(arcData, ethData, score);

    res.json({
      address: checksumAddress,
      score,
      tier: tierInfo.tier,
      tierName: tierInfo.name,
      tierEmoji: tierInfo.emoji,
      sybilRisk: sybilInfo.risk,
      sybilScore: sybilInfo.sybilScore,
      ethereum: {
        accountAge: ethData.accountAge,
        firstTxDate: ethData.firstTxDate,
        firstTxSource: ethData.firstTxSource,
        balance: ethData.ethBalance,
        txCount: ethData.txCount,
        usdcVolume: ethData.usdcVolume,
        usdcTransfers: ethData.usdcTransfers,
        usdcVolumeComplete: ethData.usdcVolumeComplete,
        usdcSource: ethData.usdcSource
      },
      arc: {
        txCount: arcData.txCount,
        tokenTransfers: arcData.tokenTransfers,
        balance: arcData.balance,
        isContract: arcData.isContract,
        usdcVolume: arcData.usdcVolume,
        usdcTransfers: arcData.usdcTransfers,
        latestTxDate: arcData.latestTxDate,
        oldestSeenTxDate: arcData.oldestSeenTxDate,
        firstTxDateComplete: arcData.firstTxDateComplete,
        latestUsdcTransferDate: arcData.latestUsdcTransferDate,
        volumeComplete: arcData.volumeComplete,
        pagesScanned: arcData.pagesScanned,
        txPagesScanned: arcData.txPagesScanned
      },
      meta: {
        durationMs: Date.now() - started,
        warnings: [
          ...(ethData.firstTxSource === 'missing_etherscan_key' ? ['ETH first tx date requires ETHERSCAN_API_KEY'] : []),
          ...(ethData.usdcSource === 'missing_etherscan_key' ? ['ETH USDC volume requires ETHERSCAN_API_KEY'] : []),
          ...(!arcData.volumeComplete ? [`Arc USDC volume truncated at ${arcData.pagesScanned} page(s)`] : []),
          ...(!arcData.firstTxDateComplete ? [`Arc first tx date truncated at ${arcData.txPagesScanned} page(s)`] : [])
        ]
      }
    });
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Analyze failed', message: error.message });
  }
});

const PROVABLE_NFT_ABI = [
  'function mintScore(address wallet,uint8 score,uint8 tier,string metadataURI) external',
  'function tokenIds(address wallet) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function owner() view returns (address)'
];

const tierNames = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

function shortAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function escapeXml(value) {
  return String(value).replace(/[&<>'\"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;' }[c]));
}

function toBase64(value) {
  return Buffer.from(value, 'utf8').toString('base64');
}

function buildNftSvg({ address, score, tier, sybilRisk, ethereum = {}, arc = {} }) {
  const tierName = tierNames[Number(tier)] || 'Bronze';
  const scoreNum = Math.max(0, Math.min(100, Number(score || 0)));
  const ring = Math.round(565 * scoreNum / 100);
  const date = new Date().toISOString().slice(0, 10);

  return `<svg width="1200" height="1200" viewBox="0 0 1200 1200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="120" y1="0" x2="1080" y2="1200" gradientUnits="userSpaceOnUse"><stop stop-color="#03090F"/><stop offset="0.48" stop-color="#071B27"/><stop offset="1" stop-color="#12323A"/></linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(840 210) rotate(110) scale(640)"><stop stop-color="#9CCED4" stop-opacity="0.42"/><stop offset="1" stop-color="#9CCED4" stop-opacity="0"/></radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="34" stdDeviation="42" flood-color="#000" flood-opacity="0.36"/></filter>
  </defs>
  <rect width="1200" height="1200" rx="72" fill="url(#bg)"/>
  <rect width="1200" height="1200" rx="72" fill="url(#glow)"/>
  ${Array.from({ length: 26 }, (_, i) => `<line x1="0" y1="${80 + i * 42}" x2="1200" y2="${80 + i * 42}" stroke="#EAF7F8" stroke-opacity="0.035"/>`).join('')}
  <circle cx="805" cy="325" r="330" stroke="#C8E1E6" stroke-opacity="0.12" stroke-width="2"/>
  <circle cx="805" cy="325" r="230" stroke="#C8E1E6" stroke-opacity="0.10" stroke-width="2"/>
  <circle cx="805" cy="325" r="122" stroke="#C8E1E6" stroke-opacity="0.08" stroke-width="2"/>
  <g filter="url(#shadow)">
    <rect x="94" y="104" width="1012" height="992" rx="48" fill="#061724" fill-opacity="0.72" stroke="#C8E1E6" stroke-opacity="0.18"/>
  </g>
  <text x="140" y="172" fill="#ACC1C8" font-family="Menlo, Monaco, Consolas, monospace" font-size="24" letter-spacing="8">{PROVEARC REPUTATION}</text>
  <g transform="translate(140 220)">
    <circle cx="52" cy="52" r="50" stroke="#C8E1E6" stroke-opacity="0.24" stroke-width="3"/>
    <path d="M17 66C17 46.67 32.67 31 52 31C71.33 31 87 46.67 87 66" stroke="#EAF7F8" stroke-width="11" stroke-linecap="round"/>
    <path d="M31 66C31 54.4 40.4 45 52 45C63.6 45 73 54.4 73 66" stroke="#7EA8AE" stroke-width="5" stroke-linecap="round"/>
  </g>
  <text x="140" y="407" fill="#EEF6F8" font-family="Inter, Arial, sans-serif" font-size="82" font-weight="300" letter-spacing="-5">PROVEARC</text>
  <text x="140" y="462" fill="#9FB4BB" font-family="Inter, Arial, sans-serif" font-size="30">Soulbound wallet reputation proof on Arc</text>
  <g transform="translate(140 540)">
    <circle cx="210" cy="210" r="190" stroke="#1E3A44" stroke-width="28"/>
    <circle cx="210" cy="210" r="190" stroke="#D7E8EB" stroke-width="28" stroke-linecap="round" stroke-dasharray="${ring} 565" transform="rotate(-90 210 210)"/>
    <text x="210" y="195" text-anchor="middle" fill="#EEF6F8" font-family="Inter, Arial, sans-serif" font-size="112" font-weight="300" letter-spacing="-8">${scoreNum}</text>
    <text x="210" y="250" text-anchor="middle" fill="#ACC1C8" font-family="Menlo, Monaco, Consolas, monospace" font-size="24" letter-spacing="5">SCORE / 100</text>
  </g>
  <g transform="translate(610 548)">
    <text x="0" y="0" fill="#ACC1C8" font-family="Menlo, Monaco, Consolas, monospace" font-size="22" letter-spacing="6">// WALLET</text>
    <text x="0" y="54" fill="#EEF6F8" font-family="Menlo, Monaco, Consolas, monospace" font-size="31">${escapeXml(shortAddress(address))}</text>
    <text x="0" y="134" fill="#ACC1C8" font-family="Menlo, Monaco, Consolas, monospace" font-size="22" letter-spacing="6">// TIER</text>
    <text x="0" y="190" fill="#D7E8EB" font-family="Inter, Arial, sans-serif" font-size="62" font-weight="300" letter-spacing="-3">${escapeXml(tierName)}</text>
    <text x="0" y="270" fill="#ACC1C8" font-family="Menlo, Monaco, Consolas, monospace" font-size="22" letter-spacing="6">// PROOF STATUS</text>
    <text x="0" y="326" fill="#BCEBDC" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="300">VERIFIED</text>
  </g>
  <g transform="translate(140 1010)">
    <rect width="920" height="1" fill="#C8E1E6" opacity="0.18"/>
    <text x="0" y="48" fill="#9FB4BB" font-family="Menlo, Monaco, Consolas, monospace" font-size="22">ETH TX: ${escapeXml(ethereum.txCount ?? 0)}  •  ARC TX: ${escapeXml(arc.txCount ?? 0)}  •  ARC USDC: ${escapeXml(arc.usdcVolume ?? '0')}  •  ${date}</text>
  </g>
</svg>`;
}

function buildMetadata(payload) {
  const svg = buildNftSvg(payload);
  const image = `data:image/svg+xml;base64,${toBase64(svg)}`;
  const tierName = tierNames[Number(payload.tier)] || 'Bronze';
  const metadata = {
    name: `ProveArc ${tierName} #${payload.address.slice(2, 8)}`,
    description: 'A soulbound ProveArc reputation badge generated from Ethereum and Arc wallet activity.',
    image,
    attributes: [
      { trait_type: 'Wallet', value: payload.address },
      { trait_type: 'Score', value: Number(payload.score), max_value: 100 },
      { trait_type: 'Tier', value: tierName },
      { trait_type: 'Proof Status', value: 'Verified Passport' },
      { trait_type: 'Ethereum Transactions', value: Number(payload.ethereum?.txCount || 0) },
      { trait_type: 'Arc Transactions', value: Number(payload.arc?.txCount || 0) },
      { trait_type: 'Arc USDC Volume', value: String(payload.arc?.usdcVolume || '0') }
    ]
  };
  return `data:application/json;base64,${toBase64(JSON.stringify(metadata))}`;
}

app.post('/api/mint', async (req, res) => {
  const { address, signature, timestamp } = req.body || {};

  // 1. Validate inputs
  if (!isAddress(address) || !signature || !timestamp) {
    return res.status(400).json({ error: 'Missing address, signature, or timestamp' });
  }

  // 2. Check timestamp freshness (5 min window)
  const now = Date.now();
  const ts = Number(timestamp);
  if (isNaN(ts) || Math.abs(now - ts) > 5 * 60 * 1000) {
    return res.status(400).json({ error: 'Signature expired — please try again' });
  }

  // 3. Verify signature — recover signer address
  const message = `ProveArc: verify wallet ownership\n\nAddress: ${address.toLowerCase()}\nTimestamp: ${timestamp}\n\nThis signature only proves you own this wallet.\nIt does NOT approve any transaction or token spending.`;

  let recovered;
  try {
    recovered = ethers.verifyMessage(message, signature);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (recovered.toLowerCase() !== address.toLowerCase()) {
    return res.status(403).json({ error: `Signature mismatch: signed by ${recovered}, expected ${address}` });
  }

  // 4. Backend scores the wallet itself — never trust frontend score
  let arcData, ethData, score, tierInfo, sybilInfo;
  try {
    [arcData, ethData] = await Promise.all([
      fetchArcData(address),
      fetchEthData(address)
    ]);
    score = calculateScore(arcData, ethData);
    tierInfo = getTier(score);
    sybilInfo = detectSybil(arcData, ethData, score);
  } catch (e) {
    console.error('Scoring error during mint:', e);
    return res.status(500).json({ error: 'Failed to score wallet', message: e.message });
  }

  const contractAddress = process.env.PROVEARC_NFT_ADDRESS || process.env.PROVABLE_NFT_ADDRESS;
  if (!process.env.DEPLOYER_PRIVATE_KEY || !contractAddress || !process.env.ARC_RPC_URL) {
    return res.status(500).json({ error: 'Mint config missing' });
  }

  // 5. Mint with backend-verified score
  try {
    const mintPayload = {
      address,
      score,
      tier: tierInfo.tier,
      sybilRisk: sybilInfo.risk,
      ethereum: {
        txCount: ethData.txCount,
        usdcVolume: ethData.usdcVolume
      },
      arc: {
        txCount: arcData.txCount,
        usdcVolume: arcData.usdcVolume
      }
    };

    const metadataURI = buildMetadata(mintPayload);
    const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);
    const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, PROVABLE_NFT_ABI, signer);

    const estimatedGas = await contract.mintScore.estimateGas(address, Number(score), Number(tierInfo.tier), metadataURI);
    const tx = await contract.mintScore(address, Number(score), Number(tierInfo.tier), metadataURI, {
      gasLimit: estimatedGas * 12n / 10n
    });
    const receipt = await tx.wait();
    const tokenId = (await contract.tokenIds(address)).toString();

    res.json({
      success: true,
      txHash: tx.hash,
      tokenId,
      contract: contractAddress,
      explorer: `https://testnet.arcscan.app/tx/${tx.hash}`,
      tokenUri: metadataURI,
      blockNumber: receipt.blockNumber,
      verifiedScore: score,
      verifiedTier: tierInfo.name
    });
  } catch (error) {
    console.error('Mint error:', error);
    res.status(500).json({ error: 'Mint failed', message: error.shortMessage || error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Mode: real-data analyze');
}).on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});
