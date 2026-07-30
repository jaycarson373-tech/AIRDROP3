import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { ScoutShell } from "../components/scout/scout-shell";
import "./globals.css";
import "./scout.css";
import "./sndk.css";

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
    default: "SNDK6900 — Flip SNDK",
    template: "%s | SNDK6900"
  },
  description: "Hold SNDK6900. Eligible holders receive SNDK automatically every five minutes, with verifiable on-chain distribution receipts.",
  applicationName: "SNDK6900",
  keywords: ["SNDK6900", "SNDK", "five-minute airdrops", "Solana", "holder rewards", "on-chain receipts"],
  openGraph: {
    title: "SNDK6900 — Flip SNDK",
    description: "Hold SNDK6900. Receive SNDK every five minutes.",
    url: siteUrl,
    siteName: "SNDK6900",
    type: "website",
    images: [
      {
        url: "/brand/og-image.png",
        width: 1280,
        height: 426,
        alt: "SNDK6900"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "SNDK6900 — Flip SNDK",
    description: "Hold SNDK6900. Receive SNDK every five minutes.",
    images: ["/brand/og-image.png"]
  },
  icons: {
    icon: "/brand/sndk6900-logo-red-square.png",
    apple: "/brand/sndk6900-logo-red-square.png"
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const launchState = process.env.LAUNCH_STATE?.trim().toLowerCase() === "live" ? "live" : "prelaunch";

  return (
    <html lang="en">
      <body className={`${terminalFont.variable} ${displayFont.variable}`}>
        <ScoutShell launchState={launchState}>{children}</ScoutShell>
      </body>
    </html>
  );
}
