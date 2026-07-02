import type { Metadata } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hoodstrategy.fun"),
  title: "HOOD Strategy",
  description: "The Robinhood meta, rebuilt for the trenches. Hold HOODSTR and track live HOODx reward distributions.",
  openGraph: {
    title: "HOOD Strategy",
    description: "The Robinhood meta, rebuilt for the trenches. Hold HOODSTR and track live HOODx reward distributions.",
    url: "https://hoodstrategy.fun",
    siteName: "HOOD Strategy",
    images: [
      {
        url: "/brand/hood-strategy-logo.png",
        width: 1200,
        height: 1200,
        alt: "HOOD Strategy"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "HOOD Strategy",
    description: "The Robinhood meta, rebuilt for the trenches. Hold HOODSTR and track live HOODx reward distributions.",
    images: ["/brand/hood-strategy-logo.png"]
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/logo.png", type: "image/png" }
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
