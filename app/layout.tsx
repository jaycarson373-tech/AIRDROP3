import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_Condensed } from "next/font/google";
import { ScoutShell } from "../components/scout/scout-shell";
import "./globals.css";
import "./scout.css";

const terminalFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-runner-terminal",
  display: "swap"
});

const displayFont = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-runner-display",
  display: "swap"
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Runner — Momentum Terminal",
    template: "%s | Runner"
  },
  description: "Runner's custom aggregator scans market momentum and airdrops the strongest runner to eligible holders every five minutes.",
  applicationName: "Runner",
  keywords: ["Runner", "Pump.fun", "momentum terminal", "Solana", "market scanner", "momentum signals"],
  openGraph: {
    title: "Runner — Momentum Terminal",
    description: "A custom momentum scanner. The strongest runner airdropped every five minutes.",
    url: siteUrl,
    siteName: "Runner",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Runner — Momentum Terminal",
    description: "A custom momentum scanner. The strongest runner airdropped every five minutes."
  },
  icons: {
    icon: "/icon.jpg"
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${terminalFont.variable} ${displayFont.variable}`}>
        <ScoutShell>{children}</ScoutShell>
      </body>
    </html>
  );
}
