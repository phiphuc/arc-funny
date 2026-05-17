# ProveArc - Sybil Detection & Reputation NFT on Arc

**Website:** provearc.xyz (to be registered)
**Tagline:** "Prove you're real"
**Created:** 2026-05-16

---

## Product Overview

Wallet reputation scoring system that:
1. Analyzes Ethereum mainnet activity (age, balance, USDC volume, DeFi)
2. Analyzes Arc testnet activity (transactions, contracts)
3. AI-powered sybil detection
4. Mints reputation NFT badge on Arc testnet
5. Score 0-100 with 5 tiers (Bronze → Diamond)

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Web3:** wagmi + viem
- **UI:** shadcn/ui components
- **Deploy:** Vercel

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Queue:** Bull (Redis)
- **Cache:** Redis (60s TTL)
- **APIs:**
  - Etherscan API (Ethereum data)
  - Arcscan API (Arc data)
  - Alchemy/Infura RPC (USDC transfers)

### Smart Contract
- **Language:** Solidity 0.8.20
- **Framework:** Foundry
- **Chain:** Arc Testnet (ChainID 5042002)
- **Standard:** ERC-721 (NFT)
- **Features:**
  - Mint reputation NFT
  - Store score on-chain
  - Update score (re-scan)
  - Metadata URI (IPFS)

### AI/Scoring
- **Engine:** Node.js (rule-based MVP)
- **Future:** Python ML model
- **Features:**
  - Account age scoring
  - Balance scoring
  - Activity scoring
  - Sybil pattern detection

---

## Architecture

```
User (paste address)
  ↓
Frontend (Next.js)
  ↓
Backend API (Express)
  ↓
┌─────────────────────────────────┐
│ Check Redis Cache               │
│   Hit → return cached result    │
│   Miss → queue job              │
└─────────────────────────────────┘
  ↓
Worker (Bull Queue)
  ↓
┌─────────────────────────────────┐
│ Parallel Data Collection        │
├─────────────────────────────────┤
│ 1. Etherscan API                │
│    - Account age                │
│    - ETH balance                │
│    - Transaction count          │
│    - USDC volume                │
│    - DeFi protocols             │
│                                 │
│ 2. Arcscan API                  │
│    - Transaction count          │
│    - USDC volume                │
│    - Unique contracts           │
└─────────────────────────────────┘
  ↓
AI Scoring Engine
  - Calculate base score (0-100)
  - Detect sybil patterns
  - Assign tier (Bronze-Diamond)
  ↓
Cache result (Redis, 60s)
  ↓
Return to frontend
  ↓
User clicks "Mint NFT"
  ↓
Smart Contract (Arc Testnet)
  - Mint ERC-721 NFT
  - Store score metadata
  - Emit event
```

---

## Scoring Model

### Total Score: 0-100

**Ethereum Activity (40 points):**
- Account age: 0-10 pts (>2 years = 10, <3 months = 0)
- ETH balance: 0-10 pts (>1 ETH = 10, 0 = 0)
- Transaction count: 0-10 pts (>500 = 10, <10 = 0)
- Active days: 0-10 pts (>100 days = 10, <10 = 0)

**Ethereum USDC (30 points):**
- USDC volume: 0-15 pts (>$10K = 15, <$100 = 0)
- DeFi protocols: 0-15 pts (>5 = 15, 0 = 0)

**Arc Activity (30 points):**
- Transaction count: 0-10 pts (>100 = 10, <5 = 0)
- USDC volume: 0-10 pts (>1000 = 10, <10 = 0)
- Unique contracts: 0-10 pts (>10 = 10, <3 = 0)

### Tiers

| Score | Tier | NFT Badge | Sybil Risk |
|-------|------|-----------|------------|
| 80-100 | 🏆 Diamond | Gold animated | Very Low |
| 60-79 | 💎 Platinum | Blue glow | Low |
| 40-59 | ⭐ Gold | Yellow | Medium |
| 20-39 | 🥈 Silver | Gray | High |
| 0-19 | 🥉 Bronze | Brown | Very High |

---

## API Endpoints

### Backend API

```
GET  /api/health
  → Health check

POST /api/analyze
  Body: { address: "0x..." }
  → Queue analysis job
  → Return: { jobId, status: "queued" }

GET  /api/analyze/:jobId
  → Get analysis result
  → Return: { status, score, tier, data }

POST /api/mint
  Body: { address: "0x...", signature }
  → Mint NFT on Arc
  → Return: { txHash, tokenId }

GET  /api/score/:address
  → Get cached score (if exists)
  → Return: { score, tier, timestamp }
```

---

## Smart Contract Interface

```solidity
contract ProveArcNFT {
    struct Score {
        uint8 totalScore;      // 0-100
        uint8 tier;            // 0-4
        uint32 timestamp;
        string metadataURI;
    }
    
    function mintScore(address wallet, uint8 score, uint8 tier, string memory uri) external;
    function getScore(address wallet) external view returns (Score memory);
    function updateScore(address wallet, uint8 newScore, uint8 newTier) external;
}
```

---

## Development Phases

### Phase 1: Smart Contract (Week 1)
- [x] Project setup
- [ ] Write ProveArcNFT.sol
- [ ] Write tests
- [ ] Deploy to Arc testnet
- [ ] Verify contract

### Phase 2: Backend API (Week 2)
- [ ] Express server setup
- [ ] Etherscan integration
- [ ] Arcscan integration
- [ ] Scoring engine
- [ ] Redis cache
- [ ] Bull queue

### Phase 3: Frontend (Week 3)
- [ ] Next.js setup
- [ ] Landing page
- [ ] Analysis page
- [ ] Results page
- [ ] Mint NFT flow
- [ ] Wallet connection

### Phase 4: Polish & Deploy (Week 4)
- [ ] Error handling
- [ ] Rate limiting
- [ ] Analytics
- [ ] Deploy frontend (Vercel)
- [ ] Deploy backend (Railway/Render)
- [ ] Domain setup

---

## Environment Variables

```env
# Ethereum
ETHERSCAN_API_KEY=
ALCHEMY_API_KEY=
INFURA_API_KEY=

# Arc
ARC_RPC_URL=https://rpc.testnet.arc.network
ARCSCAN_API_URL=https://testnet.arcscan.app/api/v2

# Redis
REDIS_URL=redis://localhost:6379

# Contract
PROVEARC_NFT_ADDRESS=
DEPLOYER_PRIVATE_KEY=

# API
PORT=3001
NODE_ENV=development
```

---

## Revenue Model

| Source | Price | Estimate |
|--------|-------|----------|
| NFT mint fee | 0.5 USDC | $500/month (1000 mints) |
| Premium API | $10/month | $500/month (50 users) |
| Bulk scoring | $0.01/address | $1000/month (100K) |

**Target:** $1-2K/month

---

## Grant Application (Circle)

**Title:** ProveArc - On-chain Reputation & Sybil Detection for Arc

**Summary:** 
ProveArc helps Arc ecosystem identify real users vs sybils by analyzing cross-chain activity (Ethereum + Arc) and minting reputation NFTs. This enables airdrops to target real users, protocols to reward genuine participants, and users to prove their legitimacy.

**Why Arc:**
- USDC-native fees (0.5 USDC per mint)
- Sub-second finality for instant NFT minting
- Identity layer (ERC-8004 compatible)
- Low gas costs enable micro-fees

**Traction Goal:**
- 1000 wallets analyzed
- 500 NFTs minted
- 10K USDC in fees processed

---

## Next Steps

1. ✅ Create project structure
2. → Write smart contract
3. → Deploy to Arc testnet
4. → Build backend API
5. → Build frontend
6. → Deploy & test
7. → Apply for Circle grant

---

**Status:** In Development
**Target Launch:** 2026-06-15 (4 weeks)
