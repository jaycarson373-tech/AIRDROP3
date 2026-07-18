import type { Metadata } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ptf.fun"),
  title: "Runner — Never Miss a Runner",
  description: "Runner uses an AI scanning system to find animal-token runners and distribute selected tokens to eligible holders every epoch.",
  openGraph: {
    title: "Runner — Never Miss a Runner",
    description: "AI-scanned animal-token runners, live epochs, eligible holders and onchain distributions.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ptf.fun",
    siteName: "Runner",
    images: [
      {
        url: "https://ptf.fun/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "Runner — Never Miss a Runner"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Runner — Never Miss a Runner",
    description: "AI-scanned animal-token runners, live epochs, eligible holders and onchain distributions.",
    images: [
      {
        url: "https://ptf.fun/brand/og-image.png",
        alt: "Runner — Never Miss a Runner"
      }
    ]
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/brand/ptf-logo.png", type: "image/png" }
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
