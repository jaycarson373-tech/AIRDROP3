import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Buffettcoin — The Onchain Buffett Basket",
    template: "%s | Buffettcoin"
  },
  description: "Buffettcoin distributes a 50/50 Buffett basket of AAPL.x and BRK.Bx to eligible holders with transparent onchain receipts.",
  applicationName: "Buffettcoin",
  keywords: ["Buffettcoin", "Buffett Coin", "BUFFETT", "tokenized stocks", "holder rewards", "Solana"],
  openGraph: {
    title: "Buffettcoin — The Onchain Buffett Basket",
    description: "Hold Buffettcoin and receive weighted 50/50 AAPL.x and BRK.Bx basket drops.",
    url: siteUrl,
    siteName: "Buffettcoin",
    type: "website",
    images: [
      {
        url: "/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "Buffettcoin — Own Buffett's Portfolio"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Buffettcoin — The Onchain Buffett Basket",
    description: "A 50/50 Apple and Berkshire holder-reward basket.",
    images: ["/brand/og-image.png"]
  },
  icons: {
    icon: "/brand/buffettcoin-mark.png",
    apple: "/brand/buffettcoin-mark.png"
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
