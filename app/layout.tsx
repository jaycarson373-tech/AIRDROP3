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
    default: "Runner Index 6900 — Persistence, Indexed",
    template: "%s | Runner Index 6900"
  },
  description: "RI6900 converts verified hold time into distribution weight, recalculated every five minutes.",
  applicationName: "Runner Index 6900",
  keywords: ["Runner Index 6900", "RI6900 Protocol", "RI6900", "Pump.fun", "holder rewards", "Solana"],
  openGraph: {
    title: "Runner Index 6900 — Persistence, Indexed",
    description: "A continuous holder index with multiplier-weighted RI6900 distributions every five minutes.",
    url: siteUrl,
    siteName: "Runner Index 6900",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Runner Index 6900 — Persistence, Indexed",
    description: "A continuous holder index with multiplier-weighted RI6900 distributions every five minutes."
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
