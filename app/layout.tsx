import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Press_Start_2P, Space_Grotesk } from "next/font/google";
import { ScoutShell } from "../components/scout/scout-shell";
import "./globals.css";
import "./scout.css";
import "./brainrot-polish.css";

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
    : "http://localhost:3001");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BRAINROT",
    template: "%s | BRAINROT"
  },
  alternates: { canonical: siteUrl },
  description: "The internet has a condition. Hold BRAINROT. Get NEURALINK through StonkFun holder rewards.",
  applicationName: "BRAINROT",
  manifest: "/manifest.webmanifest",
  keywords: ["BRAINROT", "NEURAL", "Neuralink", "PreStocks", "StonkFun", "Solana", "holder rewards"],
  openGraph: {
    title: "BRAINROT",
    description: "The internet has a condition. Hold BRAINROT. Get NEURALINK.",
    url: siteUrl,
    siteName: "BRAINROT",
    type: "website",
    images: [
      {
        url: "/brand/brainrot-banner.jpg?v=brainrot",
        width: 1280,
        height: 417,
        alt: "BRAINROT"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "BRAINROT",
    description: "The internet has a condition. Hold BRAINROT. Get NEURALINK.",
    images: ["/brand/brainrot-banner.jpg?v=brainrot"]
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png?v=fever", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png?v=fever", sizes: "16x16", type: "image/png" },
      { url: "/icon-512.png?v=fever", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png?v=fever", sizes: "180x180", type: "image/png" }]
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const rawLaunchState = (process.env.BRAINROT_LAUNCH_STATE ?? "live")
    .trim()
    .toLowerCase();
  const launchState = rawLaunchState === "prelaunch" ? "prelaunch" : "live";

  return (
    <html lang="en">
      <body className={`${terminalFont.variable} ${displayFont.variable} ${pixelFont.variable}`}>
        <ScoutShell launchState={launchState}>{children}</ScoutShell>
      </body>
    </html>
  );
}
