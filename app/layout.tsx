import type { Metadata } from "next";
import { ScoutShell } from "../components/scout/scout-shell";
import "./globals.css";
import "./scout.css";

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
  description: "Runner continuously scans the market, identifies the strongest momentum token, and distributes weighted airdrops to eligible $RUNNER holders every 5 minutes.",
  applicationName: "Runner",
  keywords: ["Runner", "Pump.fun", "momentum terminal", "Solana", "market scanner", "holder airdrops"],
  openGraph: {
    title: "Runner — Momentum Terminal",
    description: "Own the runner. Don't chase it. A live market terminal for the strongest momentum token.",
    url: siteUrl,
    siteName: "Runner",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Runner — Momentum Terminal",
    description: "Own the runner. Don't chase it."
  },
  icons: {
    icon: "/icon.jpg"
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ScoutShell>{children}</ScoutShell>
      </body>
    </html>
  );
}
