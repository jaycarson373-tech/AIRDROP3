import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Press_Start_2P, Space_Grotesk } from "next/font/google";
import { ScoutShell } from "../components/scout/scout-shell";
import "./globals.css";
import "./scout.css";

const terminalFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pump-terminal",
  display: "swap"
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-pump-display",
  display: "swap"
});

const pixelFont = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pump-accent",
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
    default: "Pump Money — Ten Holders Paid Every Five Minutes",
    template: "%s | Pump Money"
  },
  alternates: { canonical: siteUrl },
  description: "Hold PMONEY. Every five minutes, ten eligible holders are selected to receive equal shares of PUMP.",
  applicationName: "Pump Money",
  keywords: ["Pump Money", "PMONEY", "PUMP", "Solana", "holder rewards", "weighted draw", "five-minute distributions"],
  openGraph: {
    title: "PUMP MONEY.",
    description: "Hold PMONEY. Ten holders get paid PUMP every five minutes.",
    url: siteUrl,
    siteName: "Pump Money",
    type: "website",
    images: [
      {
        url: "/brand/pump-money-hero.png",
        width: 1536,
        height: 1024,
        alt: "Pump Money"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "PUMP MONEY.",
    description: "Hold PMONEY. Ten holders get paid PUMP every five minutes.",
    images: ["/brand/pump-money-hero.png"]
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/pump-money-logo.png", sizes: "1254x1254", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const launchState = process.env.PUMP_MONEY_LAUNCH_STATE?.trim().toLowerCase() === "live" ? "live" : "prelaunch";

  return (
    <html lang="en">
      <body className={`${terminalFont.variable} ${displayFont.variable} ${pixelFont.variable}`}>
        <ScoutShell launchState={launchState}>{children}</ScoutShell>
      </body>
    </html>
  );
}
