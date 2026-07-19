import type { Metadata } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";
import "./runner-terminal.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Runner — Own the Runner",
  description: "Runner follows market momentum, identifies the strongest live opportunity, and distributes weighted token drops to eligible $RUNNER holders.",
  openGraph: {
    title: "Runner — Own the Runner",
    description: "Live momentum, one active runner, weighted holder drops, and public onchain receipts.",
    url: siteUrl,
    siteName: "Runner",
    images: [
      {
        url: "/brand/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Runner — Own the runner instead of chasing it"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Runner — Own the Runner",
    description: "Live momentum, one active runner, weighted holder drops, and public onchain receipts.",
    images: [
      {
        url: "/brand/og-image.jpg",
        alt: "Runner — Own the runner instead of chasing it"
      }
    ]
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/brand/runner-logo.jpg", type: "image/jpeg" }
    ],
    apple: "/apple-touch-icon.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppPolish />
        {children}
      </body>
    </html>
  );
}
