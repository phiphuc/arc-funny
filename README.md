# ProveArc

AI-powered wallet reputation scoring & sybil detection. Users paste a wallet address, see Ethereum + Arc activity stats, get a reputation score, then mint a soulbound NFT badge on Arc Testnet.

## URLs

- Website name: **ProveArc**
- Target domain: **provearc.xyz**
- Local frontend: http://localhost:3457
- Local backend: http://localhost:3456
- Arc Testnet contract: `0x34e5cCDf38d94eBc40013676d5Ea169346B177f0`
- Arcscan: https://testnet.arcscan.app/address/0x34e5cCDf38d94eBc40013676d5Ea169346B177f0

## Project Structure

- `contracts/` — Foundry Solidity project
- `backend/` — Express API
- `frontend/` — Next.js frontend
- `PROJECT.md` — product spec

## Current Status

### Smart Contract

- Contract: `ProveArcNFT.sol`
- Type: ERC-721 soulbound/non-transferable reputation NFT
- Features:
  - Owner-only mint/update
  - Score 0-100
  - Tier 0-4
  - Metadata URI
  - Non-transferable `_beforeTokenTransfer` guard
- Tests: 12/12 passing
- Deployed on Arc Testnet: `0x34e5cCDf38d94eBc40013676d5Ea169346B177f0`

### Backend

- Express API
- `GET /health`
- `POST /api/analyze`
- `POST /api/mint` placeholder
- `/api/analyze` now uses **real data**:
  - Arcscan API: tx count, token transfers, balance, latest tx, partial Arc USDC volume
  - Ethereum RPC: ETH balance, tx count
  - Etherscan optional: first ETH tx date + Ethereum USDC volume if `ETHERSCAN_API_KEY` is set
- Arcscan pagination is capped by env vars to protect rate limits:
  - `ARCSCAN_MAX_TOKEN_PAGES=5` default
  - `ARCSCAN_MAX_TX_PAGES=3` default

### Frontend

- Next.js 14.2.33 + React 18 + Tailwind 3
- Landing page
- Results page
- Analyze flow
- Mint button placeholder

## Commands

### Contract

```bash
cd /Volumes/mayhem/arc/provable/contracts
forge test
forge build
source .env
forge script script/Deploy.s.sol:DeployScript --rpc-url $ARC_RPC_URL --broadcast --legacy
```

### Backend

```bash
cd /Volumes/mayhem/arc/provable/backend
PORT=3456 node src/index.js
```

### Frontend

```bash
cd /Volumes/mayhem/arc/provable/frontend
npm run dev -- -p 3457
npm run build
```

## Next Work

1. Add `ETHERSCAN_API_KEY` for reliable Ethereum first transaction date + USDC volume.
2. Implement real `POST /api/mint` using ethers + deployed contract.
3. Add wallet connect via wagmi/rainbowkit.
4. Add queue/rate limiter before public launch if expecting 100+ simultaneous users.
5. Deploy frontend to Vercel and backend to Railway/Render.
