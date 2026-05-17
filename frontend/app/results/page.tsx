'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] | object }) => Promise<any>;
    };
  }
}

interface Result {
  address: string;
  score: number;
  tier: number;
  tierName: string;
  tierEmoji?: string;
  sybilRisk: string;
  ethereum: {
    accountAge: number;
    firstTxDate?: string;
    balance: string;
    txCount: number;
    usdcVolume?: string | null;
    usdcTransfers?: number | null;
  };
  arc: {
    txCount: number;
    tokenTransfers: number;
    balance: string;
    isContract?: boolean;
    usdcVolume?: string;
    usdcTransfers?: number;
    latestTxDate?: string;
    volumeComplete?: boolean;
  };
  meta?: { warnings?: string[]; durationMs?: number };
}

const StatCard = ({ label, value, wide = false }: { label: string; value: string | number; wide?: boolean }) => (
  <div className={`arc-card rounded-2xl p-5 ${wide ? 'md:col-span-2' : ''}`}>
    <div className="text-2xl font-light tracking-[-0.03em] text-[#eef6f8]">{value}</div>
    <div className="arc-label mt-3 text-[0.62rem]">{label}</div>
  </div>
);

export default function ResultsPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [minting, setMinting] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState('');
  const [mintResult, setMintResult] = useState<{ txHash: string; tokenId: string; explorer: string; tokenUri?: string; image?: string; name?: string } | null>(null);
  const [mintError, setMintError] = useState('');

  const parseNftPreview = (tokenUri?: string) => {
    if (!tokenUri?.startsWith('data:application/json;base64,')) return { image: '', name: '' };
    try {
      const encoded = tokenUri.replace('data:application/json;base64,', '');
      const metadata = JSON.parse(atob(encoded));
      return { image: metadata.image || '', name: metadata.name || '' };
    } catch {
      return { image: '', name: '' };
    }
  };
  const router = useRouter();

  useEffect(() => {
    const data = localStorage.getItem('provearc_result');
    if (!data) {
      router.push('/');
      return;
    }
    setResult(JSON.parse(data));
  }, [router]);

  const ensureArcNetwork = async () => {
    if (!window.ethereum) throw new Error('MetaMask/Rabby wallet not found');

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x4CEF52' }] // 5042002
      });
    } catch (switchError: any) {
      if (switchError?.code !== 4902) throw switchError;
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x4CEF52',
          chainName: 'Arc Testnet',
          nativeCurrency: { name: 'Arc', symbol: 'ARC', decimals: 18 },
          rpcUrls: ['https://rpc.testnet.arc.network'],
          blockExplorerUrls: ['https://testnet.arcscan.app']
        }]
      });
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) throw new Error('MetaMask/Rabby wallet not found');
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts?.[0] || '';
    setConnectedAddress(account);
    return account;
  };

  const handleMint = async () => {
    if (!result) return;
    setMinting(true);
    setMintError('');
    setMintResult(null);

    try {
      // 1. Connect wallet
      const account = connectedAddress || await connectWallet();
      if (account.toLowerCase() !== result.address.toLowerCase()) {
        throw new Error(`Connected wallet ${account.slice(0, 6)}…${account.slice(-4)} does not match analyzed address`);
      }

      // 2. Switch to Arc Testnet
      await ensureArcNetwork();

      // 3. Sign ownership proof (read-only, no tx approval)
      const timestamp = Date.now().toString();
      const message = `ProveArc: verify wallet ownership\n\nAddress: ${account.toLowerCase()}\nTimestamp: ${timestamp}\n\nThis signature only proves you own this wallet.\nIt does NOT approve any transaction or token spending.`;

      if (!window.ethereum) throw new Error('Wallet not found');
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account]
      });

      // 4. Send to backend — backend re-scores and mints
      const res = await fetch('/api/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account, signature, timestamp })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || 'Mint failed');
      const preview = parseNftPreview(data.tokenUri);
      setMintResult({
        txHash: data.txHash,
        tokenId: data.tokenId,
        explorer: data.explorer,
        tokenUri: data.tokenUri,
        image: preview.image,
        name: preview.name
      });
    } catch (err: any) {
      setMintError(err.message || 'Mint failed');
    } finally {
      setMinting(false);
    }
  };

  if (!result) {
    return (
      <div className="arc-page flex min-h-screen items-center justify-center">
        <div className="shimmer h-96 w-96 rounded-[2rem]" />
      </div>
    );
  }

  const summaryText = result.score >= 80
    ? 'Strong proof profile: mature activity, high-value signals, and consistent cross-chain footprint.'
    : result.score >= 60
      ? 'Verified activity profile: enough Ethereum and Arc signals to support a credible wallet passport.'
      : result.score >= 40
        ? 'Developing proof profile: useful on-chain history with room for stronger Arc and USDC activity.'
        : 'Early proof profile: limited on-chain history, but ready to build reputation on Arc.';

  return (
    <div className="arc-page min-h-screen">
      <div className="arc-orbit" />

      <header className="relative z-10 border-b border-white/10 bg-[#04101a]/35 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <button onClick={() => router.push('/')} className="flex items-center gap-3 transition hover:opacity-80">
            <div className="relative h-9 w-9 rounded-full border border-[#c8e1e6]/35">
              <div className="absolute left-2 top-3 h-3 w-5 rounded-t-full border-x border-t border-[#d6e8eb]" />
            </div>
            <div className="text-left">
              <div className="text-lg font-semibold tracking-[0.18em] text-[#eef6f8]">PROVEARC</div>
              <div className="arc-label text-[0.58rem]">RESULTS</div>
            </div>
          </button>
          <button onClick={() => router.push('/')} className="arc-button-secondary rounded-full px-5 py-2 text-sm">Analyze another</button>
        </div>
      </header>

      <main className="relative z-10 px-6 py-12">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <section className="arc-card scan-panel animate-rise rounded-[2.25rem] p-8">
            <div className="arc-label">{'{REPUTATION OUTPUT}'}</div>
            <div className="mt-8 flex items-end justify-between gap-6">
              <div>
                <div className="text-8xl font-light leading-none tracking-[-0.08em] text-[#eef6f8]">{result.score}</div>
                <div className="mt-2 text-[#9fb4bb]">out of 100</div>
              </div>
              <div className="text-right">
                <div className="text-5xl">{result.tierEmoji || '◌'}</div>
                <div className="mt-3 text-3xl font-light uppercase tracking-[-0.04em] text-[#d7e8eb]">{result.tierName}</div>
                <div className="arc-label mt-2">Tier {result.tier}</div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 rounded-2xl bg-white/[0.045] p-5 md:grid-cols-[112px_1fr]">
              <div className="passport-book relative h-28 w-24 rounded-2xl border border-[#d7e8eb]/25 bg-[#0a2633] shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
                <div className="absolute left-3 top-3 h-4 w-4 rounded-full border border-[#d7e8eb]/60" />
                <div className="absolute bottom-4 left-3 right-3 h-2 rounded-full bg-[#d7e8eb]/25" />
                <div className="absolute bottom-8 left-3 right-6 h-2 rounded-full bg-[#d7e8eb]/18" />
                <div className="passport-proof absolute -right-5 top-8 rounded-full border-2 border-[#bcebdc] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#bcebdc]">Proof</div>
              </div>
              <div>
                <div className="arc-label">Proof summary</div>
                <div className="mt-3 text-lg leading-8 text-[#d7e8eb]">{summaryText}</div>
              </div>
            </div>

            <div className="mt-6 break-all rounded-2xl border border-white/10 bg-[#061724]/65 p-5 font-mono text-sm leading-6 text-[#b6cbd1]">
              {result.address}
            </div>

            <div className="mt-6 grid gap-3">
              {!connectedAddress ? (
                <button
                  onClick={async () => {
                    setMintError('');
                    try { await connectWallet(); } catch (err: any) { setMintError(err.message || 'Connect failed'); }
                  }}
                  className="arc-button-secondary w-full rounded-2xl px-6 py-4 text-sm font-semibold uppercase tracking-[0.14em] transition"
                >
                  Connect wallet
                </button>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-center font-mono text-sm text-[#b6cbd1]">
                  Connected: {connectedAddress.slice(0, 6)}…{connectedAddress.slice(-4)}
                </div>
              )}

              <button
                onClick={handleMint}
                disabled={minting}
                className="arc-button-primary w-full rounded-2xl px-6 py-4 text-sm font-semibold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {minting ? 'Minting on Arc...' : 'Mint designed reputation NFT'}
              </button>
            </div>

            {mintResult ? (
              <div className="mint-success-card mt-5 overflow-hidden rounded-[2rem] border border-[#bcebdc]/25 bg-[#061724]/80 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="arc-label text-[#bcebdc]">Mint complete</div>
                    <div className="mt-1 text-xl font-light text-[#eef6f8]">Token #{mintResult.tokenId}</div>
                  </div>
                  <div className="rounded-full border border-[#bcebdc]/35 bg-[#bcebdc]/10 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#d8fff0]">
                    On Arc
                  </div>
                </div>

                {mintResult.image ? (
                  <div className="nft-preview-shell rounded-[1.5rem] border border-white/10 bg-black/25 p-3">
                    <img
                      src={mintResult.image}
                      alt={mintResult.name || `ProveArc reputation NFT #${mintResult.tokenId}`}
                      className="nft-preview-image w-full rounded-[1.1rem] shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
                    />
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 text-sm text-[#b6cbd1] sm:grid-cols-2">
                  <a href={mintResult.explorer} target="_blank" className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition hover:border-[#bcebdc]/45 hover:text-[#d8fff0]">
                    <div className="arc-label mb-2">Transaction</div>
                    <div className="break-all font-mono text-xs underline">{mintResult.txHash}</div>
                  </a>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <div className="arc-label mb-2">NFT name</div>
                    <div className="text-[#eef6f8]">{mintResult.name || 'ProveArc Reputation'}</div>
                  </div>
                </div>
              </div>
            ) : null}

            {mintError ? (
              <div className="mt-4 rounded-2xl border border-red-300/25 bg-red-300/10 p-4 text-sm text-red-100">{mintError}</div>
            ) : null}

            <p className="mt-4 text-center text-sm leading-6 text-[#91a9b1]">
              Connect the analyzed wallet, switch to Arc testnet, then backend owner mints a soulbound SVG NFT with this score and wallet stats.
            </p>

            <div className="mt-4 rounded-2xl border border-[#bcebdc]/15 bg-[#bcebdc]/[0.06] px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-lg text-[#bcebdc]">🛡️</div>
                <div className="space-y-2 text-sm leading-6 text-[#b6cbd1]">
                  <div className="font-semibold text-[#d8fff0]">Your wallet is safe — here is exactly what happens:</div>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-[#bcebdc]">✓</span>
                      <span><strong className="text-[#eef6f8]">You sign a text message</strong> — this only proves you own this address. Your wallet will show the exact text. It is NOT a transaction.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-[#bcebdc]">✓</span>
                      <span><strong className="text-[#eef6f8]">No token approvals</strong> — we never ask permission to move your tokens. Zero spending risk.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-[#bcebdc]">✓</span>
                      <span><strong className="text-[#eef6f8]">We pay gas</strong> — our server mints the NFT for you. You pay nothing.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-[#bcebdc]">✓</span>
                      <span><strong className="text-[#eef6f8]">Score verified server-side</strong> — the backend re-scores your wallet independently. Nobody can fake their score.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="animate-rise-delay-1 space-y-6">
            <div className="arc-card rounded-[2.25rem] p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-3xl font-light uppercase tracking-[-0.05em]">Ethereum mainnet</h2>
                <div className="arc-label">{'// ETH'}</div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <StatCard label="Account age / days" value={result.ethereum.accountAge} />
                <StatCard label="Transactions" value={result.ethereum.txCount} />
                <StatCard label="ETH balance" value={result.ethereum.balance} />
                <StatCard label="First transaction" value={result.ethereum.firstTxDate ? new Date(result.ethereum.firstTxDate).toLocaleDateString() : 'N/A'} />
                <StatCard label="USDC volume" value={result.ethereum.usdcVolume ?? 'N/A'} wide />
              </div>
            </div>

            <div className="arc-card rounded-[2.25rem] p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-3xl font-light uppercase tracking-[-0.05em]">Arc testnet</h2>
                <div className="arc-label">{'// ARC'}</div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <StatCard label="Transactions" value={result.arc.txCount} />
                <StatCard label="Token transfers" value={result.arc.tokenTransfers} />
                <StatCard label="Balance" value={result.arc.balance} />
                <StatCard label={result.arc.volumeComplete === false ? 'USDC volume / partial' : 'USDC volume'} value={result.arc.usdcVolume ?? '0'} />
                <StatCard label="USDC transfers scanned" value={result.arc.usdcTransfers ?? 0} />
                <StatCard label="Latest Arc tx" value={result.arc.latestTxDate ? new Date(result.arc.latestTxDate).toLocaleDateString() : 'N/A'} />
              </div>
            </div>

            {result.meta?.warnings?.length ? (
              <div className="rounded-[1.5rem] border border-yellow-200/25 bg-yellow-200/10 p-5 text-sm text-yellow-100">
                <div className="arc-label mb-3 text-yellow-100">Data notes</div>
                <ul className="list-inside list-disc space-y-1">
                  {result.meta.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
