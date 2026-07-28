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
    default: "Casino Strategy — On-Chain Casino Arcade",
    template: "%s | Casino Strategy"
  },
  description: "Casino Strategy automatically enters eligible holders into a fifteen-minute on-chain arcade tournament with verifiable results.",
  applicationName: "Casino Strategy",
  keywords: ["Casino Strategy", "CASINO", "on-chain games", "Pong", "Solana", "verifiable results"],
  openGraph: {
    title: "Casino Strategy — Every 15 Minutes, A New Game",
    description: "Hold to enter ten rotating fifteen-minute tournaments with public on-chain settlement receipts.",
    url: siteUrl,
    siteName: "Casino Strategy",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Casino Strategy — Every 15 Minutes, A New Game",
    description: "A pixel-era on-chain arcade where eligible holders enter automatically."
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
