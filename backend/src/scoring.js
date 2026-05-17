import dotenv from 'dotenv';
import axios from 'axios';
import { ethers } from 'ethers';

dotenv.config();

const ARCSCAN_BASE = process.env.ARCSCAN_API_URL || 'https://testnet.arcscan.app/api/v2';
const ETHERSCAN_BASE = process.env.ETHERSCAN_API_URL || 'https://api.etherscan.io/v2/api';
const ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY || '';
const ETH_RPC_URL = process.env.ETH_RPC_URL || 'https://ethereum-rpc.publicnode.com';

const ARC_USDC = (process.env.ARC_USDC_ADDRESS || '0x3600000000000000000000000000000000000000').toLowerCase();
const ETH_USDC = (process.env.ETH_USDC_ADDRESS || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48').toLowerCase();
const ARCSCAN_MAX_TOKEN_PAGES = Number(process.env.ARCSCAN_MAX_TOKEN_PAGES || 5); // 50 transfers/page
const ARCSCAN_MAX_TX_PAGES = Number(process.env.ARCSCAN_MAX_TX_PAGES || 3);

const http = axios.create({
  timeout: 20000,
  headers: { 'User-Agent': 'ProveArc/1.0 (+https://provearc.xyz)' }
});

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatUnitsSafe(value, decimals = 18) {
  try {
    return ethers.formatUnits(String(value || '0'), Number(decimals));
  } catch {
    return '0';
  }
}

function addDecimalStrings(a, b) {
  return (Number(a || 0) + Number(b || 0)).toFixed(6).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

function tokenAmountFromTransfer(item) {
  const decimals = item?.token?.decimals ?? item?.total?.decimals ?? 0;
  const value = item?.total?.value ?? item?.total?.value_exact ?? item?.value ?? '0';
  return formatUnitsSafe(value, decimals);
}

function getNextPageParams(data) {
  return data?.next_page_params || null;
}

/**
 * Fetch paginated Arc token transfers and aggregate USDC volume.
 * Capped by ARCSCAN_MAX_TOKEN_PAGES to protect API rate limits.
 */
async function fetchArcUsdcVolume(address) {
  let pageParams = null;
  let pagesScanned = 0;
  let usdcVolume = '0';
  let usdcTransfers = 0;
  let latestUsdcTransferDate = null;

  while (pagesScanned < ARCSCAN_MAX_TOKEN_PAGES) {
    const params = pageParams || {};
    const res = await http.get(`${ARCSCAN_BASE}/addresses/${address}/token-transfers`, { params });
    const items = res.data?.items || [];

    for (const item of items) {
      const tokenAddress = item?.token?.address_hash?.toLowerCase();
      const symbol = item?.token?.symbol?.toUpperCase();
      if (tokenAddress === ARC_USDC || symbol === 'USDC') {
        usdcTransfers += 1;
        usdcVolume = addDecimalStrings(usdcVolume, tokenAmountFromTransfer(item));
        if (!latestUsdcTransferDate && item.timestamp) latestUsdcTransferDate = item.timestamp;
      }
    }

    pagesScanned += 1;
    pageParams = getNextPageParams(res.data);
    if (!pageParams) break;
  }

  return {
    usdcVolume,
    usdcTransfers,
    latestUsdcTransferDate,
    pagesScanned,
    volumeComplete: !pageParams
  };
}

async function fetchArcTxDates(address) {
  let pageParams = null;
  let pagesScanned = 0;
  let latestTxDate = null;
  let oldestSeenTxDate = null;
  let complete = false;

  while (pagesScanned < ARCSCAN_MAX_TX_PAGES) {
    const params = pageParams || {};
    const res = await http.get(`${ARCSCAN_BASE}/addresses/${address}/transactions`, { params });
    const items = res.data?.items || [];

    for (const tx of items) {
      if (!latestTxDate && tx.timestamp) latestTxDate = tx.timestamp;
      if (tx.timestamp) oldestSeenTxDate = tx.timestamp;
    }

    pagesScanned += 1;
    pageParams = getNextPageParams(res.data);
    if (!pageParams) {
      complete = true;
      break;
    }
  }

  return { latestTxDate, oldestSeenTxDate, firstTxDateComplete: complete, txPagesScanned: pagesScanned };
}

/** Fetch Arc testnet data for an address. */
export async function fetchArcData(address) {
  const [countersRes, addressRes, volumeRes, txDateRes] = await Promise.allSettled([
    http.get(`${ARCSCAN_BASE}/addresses/${address}/counters`),
    http.get(`${ARCSCAN_BASE}/addresses/${address}`),
    fetchArcUsdcVolume(address),
    fetchArcTxDates(address)
  ]);

  const counters = countersRes.status === 'fulfilled' ? countersRes.value.data : {};
  const addressInfo = addressRes.status === 'fulfilled' ? addressRes.value.data : {};
  const volume = volumeRes.status === 'fulfilled' ? volumeRes.value : {
    usdcVolume: '0', usdcTransfers: 0, latestUsdcTransferDate: null, pagesScanned: 0, volumeComplete: false
  };
  const txDates = txDateRes.status === 'fulfilled' ? txDateRes.value : {
    latestTxDate: null, oldestSeenTxDate: null, firstTxDateComplete: false, txPagesScanned: 0
  };

  const txCount = toNumber(counters.transactions_count);
  const tokenTransfers = toNumber(counters.token_transfers_count);
  const balance = formatUnitsSafe(addressInfo.coin_balance || '0', 18);

  return {
    txCount,
    tokenTransfers,
    balance: Number(balance).toFixed(4),
    isContract: Boolean(addressInfo.is_contract),
    ...volume,
    ...txDates
  };
}

async function fetchEtherscanFirstTx(address) {
  if (!ETHERSCAN_KEY) return { firstTxDate: null, accountAge: 0, source: 'missing_etherscan_key' };

  const res = await http.get(ETHERSCAN_BASE, {
    params: {
      chainid: 1,
      module: 'account',
      action: 'txlist',
      address,
      startblock: 0,
      endblock: 99999999,
      page: 1,
      offset: 1,
      sort: 'asc',
      apikey: ETHERSCAN_KEY
    }
  });

  const firstTx = Array.isArray(res.data?.result) ? res.data.result[0] : null;
  const firstTxDate = firstTx?.timeStamp ? new Date(Number(firstTx.timeStamp) * 1000) : null;
  return {
    firstTxDate: firstTxDate ? firstTxDate.toISOString() : null,
    accountAge: firstTxDate ? Math.floor((Date.now() - firstTxDate.getTime()) / 86400000) : 0,
    source: 'etherscan'
  };
}

async function fetchEthUsdcVolume(address) {
  if (!ETHERSCAN_KEY) return { usdcVolume: null, usdcTransfers: null, volumeComplete: false, source: 'missing_etherscan_key' };

  const res = await http.get(ETHERSCAN_BASE, {
    params: {
      chainid: 1,
      module: 'account',
      action: 'tokentx',
      contractaddress: ETH_USDC,
      address,
      page: 1,
      offset: 10000,
      startblock: 0,
      endblock: 99999999,
      sort: 'asc',
      apikey: ETHERSCAN_KEY
    }
  });

  const rows = Array.isArray(res.data?.result) ? res.data.result : [];
  let volume = '0';
  for (const row of rows) {
    volume = addDecimalStrings(volume, formatUnitsSafe(row.value, row.tokenDecimal || 6));
  }
  return { usdcVolume: volume, usdcTransfers: rows.length, volumeComplete: rows.length < 10000, source: 'etherscan' };
}

/** Fetch Ethereum mainnet data for an address. */
export async function fetchEthData(address) {
  const provider = new ethers.JsonRpcProvider(ETH_RPC_URL);

  const [balanceResult, txCountResult, firstTxResult, usdcResult] = await Promise.allSettled([
    provider.getBalance(address),
    provider.getTransactionCount(address),
    fetchEtherscanFirstTx(address),
    fetchEthUsdcVolume(address)
  ]);

  const ethBalance = balanceResult.status === 'fulfilled' ? ethers.formatEther(balanceResult.value) : '0';
  const txCount = txCountResult.status === 'fulfilled' ? txCountResult.value : 0;
  const firstTx = firstTxResult.status === 'fulfilled' ? firstTxResult.value : { firstTxDate: null, accountAge: 0, source: 'error' };
  const usdc = usdcResult.status === 'fulfilled' ? usdcResult.value : { usdcVolume: null, usdcTransfers: null, volumeComplete: false, source: 'error' };

  return {
    accountAge: firstTx.accountAge,
    firstTxDate: firstTx.firstTxDate,
    firstTxSource: firstTx.source,
    ethBalance: Number(ethBalance).toFixed(4),
    txCount,
    usdcVolume: usdc.usdcVolume,
    usdcTransfers: usdc.usdcTransfers,
    usdcVolumeComplete: usdc.volumeComplete,
    usdcSource: usdc.source
  };
}

/** Calculate reputation score (0-100). */
export function calculateScore(arcData, ethData) {
  let score = 0;

  // Ethereum Activity (45 pts)
  score += Math.min(12, Math.floor((ethData.accountAge || 0) / 60)); // 2y ~= 12
  score += Math.min(10, Math.floor(Number(ethData.ethBalance || 0) * 10)); // 1 ETH = 10
  score += Math.min(13, Math.floor((ethData.txCount || 0) / 40)); // 520 tx = 13

  const ethUsdc = ethData.usdcVolume == null ? 0 : Number(ethData.usdcVolume);
  if (ethUsdc >= 100000) score += 10;
  else if (ethUsdc >= 10000) score += 8;
  else if (ethUsdc >= 1000) score += 5;
  else if (ethUsdc >= 100) score += 2;

  // Arc Activity (55 pts)
  score += Math.min(15, Math.floor((arcData.txCount || 0) / 20));
  score += Math.min(10, Math.floor((arcData.tokenTransfers || 0) / 20));
  score += Math.min(10, Math.floor(Number(arcData.balance || 0) / 1000));

  const arcUsdc = Number(arcData.usdcVolume || 0);
  if (arcUsdc >= 100000) score += 20;
  else if (arcUsdc >= 10000) score += 16;
  else if (arcUsdc >= 1000) score += 10;
  else if (arcUsdc >= 100) score += 5;
  else if (arcUsdc > 0) score += 2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getTier(score) {
  if (score >= 80) return { tier: 4, name: 'Diamond', emoji: '💎' };
  if (score >= 60) return { tier: 3, name: 'Platinum', emoji: '🏆' };
  if (score >= 40) return { tier: 2, name: 'Gold', emoji: '⭐' };
  if (score >= 20) return { tier: 1, name: 'Silver', emoji: '🥈' };
  return { tier: 0, name: 'Bronze', emoji: '🥉' };
}

export function detectSybil(arcData, ethData) {
  let sybilScore = 0;

  if ((ethData.accountAge || 0) < 30 && ethData.firstTxSource !== 'missing_etherscan_key') sybilScore += 20;
  if (Number(ethData.ethBalance || 0) < 0.01) sybilScore += 12;
  if ((ethData.txCount || 0) < 10) sybilScore += 18;
  if ((arcData.txCount || 0) < 5) sybilScore += 12;
  if ((arcData.tokenTransfers || 0) < 3) sybilScore += 12;
  if (Number(arcData.usdcVolume || 0) === 0) sybilScore += 10;

  if ((ethData.accountAge || 0) > 730) sybilScore -= 18;
  if ((ethData.txCount || 0) > 500) sybilScore -= 15;
  if ((arcData.tokenTransfers || 0) > 50) sybilScore -= 15;
  if (Number(arcData.usdcVolume || 0) > 10000) sybilScore -= 15;

  sybilScore = Math.max(0, Math.min(100, Math.round(sybilScore)));

  let risk = 'Very High';
  if (sybilScore < 20) risk = 'Very Low';
  else if (sybilScore < 40) risk = 'Low';
  else if (sybilScore < 60) risk = 'Medium';
  else if (sybilScore < 80) risk = 'High';

  return { sybilScore, risk };
}
