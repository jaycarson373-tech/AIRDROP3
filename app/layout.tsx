import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Press_Start_2P, Space_Grotesk } from "next/font/google";
import { ScoutShell } from "../components/scout/scout-shell";
import "./globals.css";
import "./scout.css";

const terminalFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-runner-terminal",
  display: "swap"
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-runner-display",
  display: "swap"
});

const pixelFont = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-casino-pixel",
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
    default: "Casino — Five-Minute On-Chain Tournaments",
    template: "%s | Casino"
  },
  description: "Casino automatically enters eligible holders into five-minute on-chain tournaments with verifiable results.",
  applicationName: "Casino",
  keywords: ["Casino", "CASINO", "on-chain games", "five-minute tournaments", "Solana", "verifiable results"],
  openGraph: {
    title: "Casino — Every 5 Minutes, A New Game",
    description: "Hold to enter ten rotating five-minute tournaments with public on-chain settlement receipts.",
    url: siteUrl,
    siteName: "Casino",
    type: "website",
    images: [
      {
        url: "/brand/og-image.png",
        width: 2048,
        height: 682,
        alt: "Casino"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Casino — Every 5 Minutes, A New Game",
    description: "A pixel-era on-chain arcade where eligible holders enter automatically.",
    images: ["/brand/og-image.png"]
  },
  icons: {
    icon: "/brand/casino-logo.png",
    apple: "/brand/casino-logo.png"
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const launchState = process.env.LAUNCH_STATE?.trim().toLowerCase() === "live" ? "live" : "prelaunch";

  return (
    <html lang="en">
      <body className={`${terminalFont.variable} ${displayFont.variable} ${pixelFont.variable}`}>
        <ScoutShell launchState={launchState}>{children}</ScoutShell>
      </body>
    </html>
  );
}
