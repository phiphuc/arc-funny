# Provable - Development Progress

**Date:** 2026-05-16
**Time:** 00:13 AM (1h13 phút làm việc)

---

## ✅ HOÀN THÀNH

### 1. Project Setup
- ✅ Created `/Volumes/mayhem/arc/provable/`
- ✅ Structure: contracts, backend, frontend, docs
- ✅ Git initialized
- ✅ Foundry initialized with OpenZeppelin

### 2. Smart Contract — ProvableNFT.sol
- ✅ **ERC-721 Soulbound NFT** with reputation scoring
- ✅ Features:
  - Mint NFT with score 0-100
  - 5 tiers: Bronze (0-19), Silver (20-39), Gold (40-59), Platinum (60-79), Diamond (80-100)
  - Soulbound (non-transferable via `_update` override)
  - Update score function
  - On-chain metadata URI (IPFS)
  - Owner-only minting
- ✅ **7/7 tests PASS:**
  - testMintScore ✅
  - testUpdateScore ✅
  - testCannotMintInvalidScore ✅
  - testCannotMintInvalidTier ✅
  - testMultipleUsers ✅
  - testTokenURI ✅
  - testOnlyOwnerCanMint ✅
- ✅ Compiled successfully (Solidity 0.8.30)
- ✅ Deploy script written (`script/Deploy.s.sol`)

### 3. Documentation
- ✅ `PROJECT.md` — Full specification, architecture, scoring model, timeline
- ✅ `.env.example` — Environment variables template
- ✅ `PROGRESS.md` — This file

### 4. Deployment Preparation
- ✅ New wallet created: `0x832955500cC795Cd61994Cb36dc3bDff64570135`
- ✅ Private key stored in `.env`
- ⏳ **BLOCKED:** Faucet requires reCAPTCHA (cannot automate)

---

## 🚧 BLOCKED — Cần Action

### Deploy Contract
**Blocker:** Wallet cần ETH/USDC trên Arc testnet để trả gas

**Options:**
1. **Manual faucet:** Bạn vào https://faucet.circle.com/, nhập `0x832955500cC795Cd61994Cb36dc3bDff64570135`, solve CAPTCHA, nhận 20 USDC
2. **Use existing wallet:** Nếu bạn có wallet với ETH trên Arc testnet, thay `PRIVATE_KEY` trong `.env`
3. **Check if Arc testnet is free:** Thử deploy xem có cần gas không

**Deploy command (khi có gas):**
```bash
cd /Volumes/mayhem/arc/provable/contracts
source .env
forge script script/Deploy.s.sol:DeployProvableNFT \
  --rpc-url $ARC_RPC_URL \
  --broadcast \
  --verify
```

---

## 📋 NEXT STEPS (Week 1 — còn 6 ngày)

### Smart Contract (còn 1 ngày)
- [ ] Get testnet ETH/USDC (manual faucet hoặc existing wallet)
- [ ] Deploy ProvableNFT to Arc testnet
- [ ] Verify contract on Arcscan
- [ ] Test mint NFT on testnet
- [ ] Update `.env` with deployed address

### Backend API (Week 2 — 7 ngày)
- [ ] Express.js server setup
- [ ] Etherscan API integration (Ethereum mainnet data)
- [ ] Arcscan API integration (Arc testnet data)
- [ ] Scoring algorithm implementation
  - Account age scoring
  - Balance scoring
  - Transaction count scoring
  - USDC volume scoring
  - DeFi protocol detection
  - Sybil pattern detection
- [ ] Redis cache setup (60s TTL)
- [ ] Bull queue for job processing
- [ ] Rate limiting (75 req/burst per IP)
- [ ] Proxy pool integration (optional, if needed)
- [ ] API endpoints:
  - `POST /api/analyze` — Queue analysis job
  - `GET /api/analyze/:jobId` — Get result
  - `POST /api/mint` — Mint NFT
  - `GET /api/score/:address` — Get cached score

### Frontend (Week 3 — 7 ngày)
- [ ] Next.js 14 setup (App Router)
- [ ] Tailwind CSS + shadcn/ui
- [ ] Landing page
  - Hero section
  - How it works
  - Features
  - FAQ
- [ ] Analysis page
  - Address input
  - Loading state with progress
  - Results display (score, tier, breakdown)
- [ ] Mint NFT flow
  - Connect wallet (wagmi)
  - Sign transaction
  - Success state with NFT link
- [ ] Wallet connection (RainbowKit or ConnectKit)

### Deploy & Launch (Week 4 — 7 ngày)
- [ ] Frontend deploy to Vercel
- [ ] Backend deploy to Railway/Render
- [ ] Domain setup (provable.xyz — $2/year)
- [ ] SSL certificate
- [ ] Analytics (Plausible or Vercel Analytics)
- [ ] Error monitoring (Sentry)
- [ ] Apply for Circle Grant
  - Write grant proposal
  - Demo video
  - Traction metrics (wallets analyzed, NFTs minted)

---

## 🎯 GRANT APPLICATION (Circle)

**Title:** Provable — On-chain Reputation & Sybil Detection for Arc

**Summary:**
Provable helps Arc ecosystem identify real users vs sybils by analyzing cross-chain activity (Ethereum + Arc) and minting reputation NFTs. This enables airdrops to target real users, protocols to reward genuine participants, and users to prove their legitimacy.

**Why Arc:**
- USDC-native fees (0.5 USDC per mint)
- Sub-second finality for instant NFT minting
- Identity layer (ERC-8004 compatible)
- Low gas costs enable micro-fees

**Traction Goals:**
- 1000 wallets analyzed
- 500 NFTs minted
- 10K USDC in fees processed

**Timeline:** 4 weeks (launch by 2026-06-15)

---

## 📊 Technical Specs

### Smart Contract
- **Chain:** Arc Testnet (ChainID 5042002)
- **Standard:** ERC-721 (Soulbound)
- **Solidity:** 0.8.20
- **Framework:** Foundry
- **Tests:** 7/7 passing
- **Gas:** ~160K per mint

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Queue:** Bull (Redis)
- **Cache:** Redis (60s TTL)
- **Rate Limit:** 75 req/burst per IP

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Web3:** wagmi + viem
- **UI:** shadcn/ui

### APIs Used
- Etherscan API (Ethereum data)
- Arcscan API (Arc data)
- Alchemy/Infura RPC (USDC transfers)

---

## 💰 Revenue Model

| Source | Price | Estimate |
|--------|-------|----------|
| NFT mint fee | 0.5 USDC | $500/month (1000 mints) |
| Premium API | $10/month | $500/month (50 users) |
| Bulk scoring | $0.01/address | $1000/month (100K) |

**Target:** $1-2K/month

---

## 🔑 Key Files

```
/Volumes/mayhem/arc/provable/
├── PROJECT.md              # Full specification
├── PROGRESS.md             # This file
├── .env.example            # Environment template
├── contracts/
│   ├── src/
│   │   └── ProvableNFT.sol        # ✅ Main contract (147 lines)
│   ├── test/
│   │   └── ProvableNFT.t.sol      # ✅ 7 tests passing
│   ├── script/
│   │   └── Deploy.s.sol           # ✅ Deploy script
│   ├── foundry.toml               # ✅ Config
│   └── .env                       # ⚠️ Has private key
├── backend/                # 📋 TODO
├── frontend/               # 📋 TODO
└── docs/                   # 📋 TODO
```

---

## 🚀 Quick Start (Resume Work)

### 1. Get Testnet Funds
```bash
# Option A: Manual faucet
open https://faucet.circle.com/
# Paste: 0x832955500cC795Cd61994Cb36dc3bDff64570135
# Solve CAPTCHA, get 20 USDC

# Option B: Check balance
cast balance 0x832955500cC795Cd61994Cb36dc3bDff64570135 \
  --rpc-url https://rpc.testnet.arc.network
```

### 2. Deploy Contract
```bash
cd /Volumes/mayhem/arc/provable/contracts
source .env
forge script script/Deploy.s.sol:DeployProvableNFT \
  --rpc-url $ARC_RPC_URL \
  --broadcast
```

### 3. Verify Contract
```bash
# After deploy, get contract address from output
forge verify-contract <CONTRACT_ADDRESS> \
  src/ProvableNFT.sol:ProvableNFT \
  --chain-id 5042002 \
  --verifier-url https://testnet.arcscan.app/api
```

### 4. Test Mint
```bash
# Mint test NFT
cast send <CONTRACT_ADDRESS> \
  "mintScore(address,uint8,uint8,string)" \
  0x832955500cC795Cd61994Cb36dc3bDff64570135 \
  85 \
  4 \
  "ipfs://QmTest123" \
  --rpc-url $ARC_RPC_URL \
  --private-key $PRIVATE_KEY
```

---

## 📝 Notes

- **Foundry version:** 0.2.0 (old, but works)
- **OpenZeppelin:** v5.6.1 (patched `evm_version` from osaka → cancun)
- **Wallet:** New wallet created, needs funding
- **Domain:** provable.xyz not registered yet ($2/year)
- **Time spent:** 1h13m (setup + contract + tests)
- **Time remaining:** ~27 days to launch

---

**Status:** ⏸️ Paused — waiting for testnet funds
**Next action:** Get USDC from faucet (manual) or use existing wallet
**Resume:** Deploy contract → build backend → build frontend → launch
