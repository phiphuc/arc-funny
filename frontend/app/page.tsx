'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const contractUrl = 'https://testnet.arcscan.app/address/0x34e5cCDf38d94eBc40013676d5Ea169346B177f0';

export default function Home() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setError('Invalid Ethereum address');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });

      if (!res.ok) throw new Error('Analysis failed');

      const data = await res.json();
      localStorage.setItem('provearc_result', JSON.stringify(data));
      router.push('/results');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="arc-page flex min-h-screen flex-col">
      <div className="arc-orbit" />

      <header className="relative z-10 border-b border-white/10 bg-[#04101a]/35 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-full border border-[#c8e1e6]/35">
              <div className="absolute left-2 top-3 h-3 w-5 rounded-t-full border-x border-t border-[#d6e8eb]" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-[0.18em] text-[#eef6f8]">PROVEARC</div>
              <div className="arc-label text-[0.58rem]">ARC REPUTATION</div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-[#9fb4bb] md:flex">
            <a href="#how" className="transition hover:text-white">Build trust</a>
            <a href={contractUrl} target="_blank" className="transition hover:text-white">Contract</a>
            <a href="https://www.arc.io/" target="_blank" className="rounded-full border border-white/15 px-4 py-2 text-[#d4e6ea] transition hover:bg-white/10">Start on Arc</a>
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center px-6 py-20">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.06fr_0.94fr]">
          <section className="animate-rise space-y-8">
            <div className="arc-label">{'{ARC WALLET INTELLIGENCE}'}</div>
            <div className="space-y-6">
              <h1 className="max-w-5xl text-6xl font-light uppercase leading-[0.93] tracking-[-0.055em] text-[#eef6f8] md:text-8xl">
                Prove your wallet is real
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#a9bdc3] md:text-xl">
                Paste any wallet address — no connection, no signature, no approval needed. ProveArc reads public blockchain data to score reputation and mint a soulbound NFT on Arc.
              </p>
            </div>

            <form onSubmit={handleAnalyze} className="arc-card max-w-2xl rounded-[2rem] p-3">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Paste wallet address 0x..."
                    className="h-16 w-full rounded-[1.35rem] border border-white/10 bg-[#061724]/80 px-5 font-mono text-sm text-[#eef6f8] outline-none transition placeholder:text-[#718991] focus:border-[#c8e1e6]/55"
                    disabled={loading}
                  />
                  {error && <p className="absolute -bottom-6 left-2 text-sm text-red-300">{error}</p>}
                </div>
                <button
                  type="submit"
                  disabled={loading || !address}
                  className="arc-button-primary animate-glow-pulse h-16 rounded-[1.35rem] px-7 text-sm font-semibold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            </form>

            <div className="grid max-w-2xl grid-cols-3 gap-3 pt-2">
              {[
                ['{NO CONNECT}', 'Just paste address'],
                ['{READ-ONLY}', 'Public data only'],
                ['{FREE MINT}', 'We pay gas for you']
              ].map(([top, bottom]) => (
                <div key={top} className="arc-card rounded-2xl p-4">
                  <div className="arc-label text-[0.62rem]">{top}</div>
                  <div className="mt-3 text-sm text-[#d5e6ea]">{bottom}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex max-w-2xl items-start gap-3 rounded-2xl border border-[#bcebdc]/15 bg-[#bcebdc]/[0.06] px-5 py-4">
              <div className="mt-0.5 text-lg text-[#bcebdc]">🛡️</div>
              <div className="text-sm leading-6 text-[#b6cbd1]">
                <span className="font-semibold text-[#d8fff0]">Your wallet is never at risk.</span> Scoring only reads public blockchain data — no wallet connection, no token approvals, no signatures. Even minting is optional and gas-free: our server mints the NFT for you.
              </div>
            </div>
          </section>

          <section className="arc-card scan-panel animate-rise-delay-1 animate-float-soft relative overflow-hidden rounded-[2.25rem] p-8">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-[#c8e1e6]/15" />
            <div className="absolute -right-10 top-16 h-44 w-44 rounded-full border border-[#c8e1e6]/10" />
            <div className="relative space-y-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div>
                  <div className="arc-label">{'// LIVE MODEL'}</div>
                  <h2 className="mt-3 text-3xl font-light uppercase tracking-[-0.04em]">Wallet proof engine</h2>
                </div>
                <div className="h-3 w-3 rounded-full bg-[#bfe2e5] shadow-[0_0_30px_rgba(191,226,229,0.9)]" />
              </div>

              <div className="grid gap-3">
                {[
                  ['01', 'Ethereum age, balance, tx count, USDC flow'],
                  ['02', 'Arc tx activity, token movement, latest settlement'],
                  ['03', 'Identity summary and reputation tier'],
                  ['04', 'Sign text to verify ownership — no tx, no approval'],
                  ['05', 'Free soulbound mint — we pay gas, you pay nothing']
                ].map(([n, text]) => (
                  <div key={n} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="arc-label w-10 text-[#d7e8eb]">//{n}</div>
                    <div className="text-sm leading-6 text-[#b5c8ce]">{text}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-[#d7e8eb] p-5 text-[#071925]">
                <div className="font-mono text-xs uppercase tracking-[0.18em] opacity-70">Output</div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <div><div className="text-3xl font-light">0-100</div><div className="text-xs opacity-70">score</div></div>
                  <div><div className="text-3xl font-light">5</div><div className="text-xs opacity-70">tiers</div></div>
                  <div><div className="text-3xl font-light">NFT</div><div className="text-xs opacity-70">proof</div></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <section id="how" className="relative z-10 border-t border-white/10 bg-[#eef6f8] px-6 py-20 text-[#071925]">
        <div className="mx-auto max-w-7xl">
          <div className="arc-label text-[#526970]">{'{HOW IT WORKS}'}</div>
          <h2 className="mt-4 max-w-3xl text-5xl font-light uppercase leading-none tracking-[-0.05em]">Reputation that financial apps can verify</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              ['01', 'Paste address', 'Submit any EVM address. No wallet connection needed. ProveArc reads public Ethereum + Arc data only.'],
              ['02', 'Score signals', 'The engine weighs account age, tx activity, USDC flow, Arc adoption — all from public blockchain data.'],
              ['03', 'Verify & mint', 'Want the NFT? Sign a text message to prove ownership. No transaction, no approval, no spending. We mint for free.']
            ].map(([n, title, desc]) => (
              <div key={n} className="rounded-[1.5rem] border border-[#071925]/10 bg-white p-6">
                <div className="font-mono text-xs tracking-[0.18em] text-[#526970]">//R.{n}</div>
                <h3 className="mt-8 text-2xl font-light uppercase tracking-[-0.035em]">{title}</h3>
                <p className="mt-4 leading-7 text-[#526970]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-6 py-10 text-sm text-[#91a9b1]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p>Built on Arc testnet • Powered by Arcscan, Etherscan and Circle USDC signals</p>
          <a href={contractUrl} target="_blank" className="text-[#d7e8eb] hover:text-white">View deployed contract →</a>
        </div>
      </footer>
    </div>
  );
}
