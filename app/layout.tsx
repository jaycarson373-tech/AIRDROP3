import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Press_Start_2P, Space_Grotesk } from "next/font/google";
import { ScoutShell } from "../components/scout/scout-shell";
import "./globals.css";
import "./scout.css";

const terminalFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-goat-terminal",
  display: "swap"
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-goat-display",
  display: "swap"
});

const pixelFont = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-goat-accent",
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
    default: "GOAT — The 2026 Goatcoin",
    template: "%s | GOAT"
  },
  description: "A GOAT emerged onchain. Hold GOAT and receive ANSEM + CATE distributions every five minutes.",
  applicationName: "GOAT",
  keywords: ["GOAT", "ANSEM", "CATE", "PoorGoat", "Solana", "holder rewards", "five-minute distributions"],
  openGraph: {
    title: "THE 2026 GOATCOIN.",
    description: "Hold GOAT. Receive the GOAT's conviction plays.",
    url: siteUrl,
    siteName: "GOAT",
    type: "website",
    images: [
      {
        url: "/brand/goat-hero.jpg",
        width: 1280,
        height: 720,
        alt: "GOAT — The 2026 Goatcoin"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "THE 2026 GOATCOIN.",
    description: "Hold GOAT. Receive the GOAT's conviction plays.",
    images: ["/brand/goat-hero.jpg"]
  },
  icons: {
    icon: "/brand/goat-logo.png",
    apple: "/brand/goat-logo.png"
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
