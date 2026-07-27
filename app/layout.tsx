import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
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
    default: "Cat Strategy — Cat Runner Strategy",
    template: "%s | Cat Strategy"
  },
  description: "Cat Strategy tracks cat-token runner momentum and drops the active cat runner to eligible CSTR holders with onchain receipts.",
  applicationName: "Cat Strategy",
  keywords: ["Cat Strategy", "CSTR", "cat tokens", "runner rewards", "holder rewards", "Solana"],
  openGraph: {
    title: "Cat Strategy — Cat Runner Strategy",
    description: "Hold CSTR. Receive the active cat-token runner as Cat Strategy rotates through the cat meta.",
    url: siteUrl,
    siteName: "Cat Strategy",
    type: "website",
    images: [
      {
        url: "/brand/cat-strategy-banner.jpg",
        width: 1280,
        height: 426,
        alt: "Cat Strategy"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Cat Strategy — Cat Runner Strategy",
    description: "A live cat-token runner reward terminal for CSTR holders.",
    images: ["/brand/cat-strategy-banner.jpg"]
  },
  icons: {
    icon: "/brand/cat-strategy-logo.jpg",
    apple: "/brand/cat-strategy-logo.jpg"
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
