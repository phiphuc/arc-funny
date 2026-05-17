import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProveArc — Prove you're real",
  description: "AI-powered wallet reputation scoring & sybil detection on Arc Network. Mint your reputation NFT.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  openGraph: {
    title: "ProveArc",
    description: "Prove you're real. Mint your on-chain reputation.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
