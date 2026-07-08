import type { Metadata } from "next";
import type { Viewport } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://catinhood.fun"),
  title: "catinhood",
  description: "Cat in Hood uses creator fees to buy HoodX and airdrop it to eligible CIH holders every five minutes.",
  openGraph: {
    title: "catinhood",
    description: "Hold 1M+ CIH for automatic HoodX airdrops. Wallets above 5% are excluded.",
    url: "https://catinhood.fun",
    siteName: "catinhood",
    images: [
      {
        url: "/brand/cat-in-hood-logo.png",
        width: 512,
        height: 512,
        alt: "catinhood"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "catinhood",
    description: "Creator fees buy HoodX and airdrop it to eligible CIH holders every five minutes.",
    images: ["/brand/cat-in-hood-logo.png"]
  },
  icons: {
    icon: [
      { url: "/brand/cat-in-hood-logo.png", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/logo.png", type: "image/png" }
    ],
    apple: "/apple-touch-icon.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#9cff00"
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
