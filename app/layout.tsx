import type { Metadata } from "next";
import type { Viewport } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://robinhoodsol.fun"),
  title: "Robin Hood",
  description: "Robin Hood on Solana uses creator fees to buy HOOD and airdrop it to eligible holders every five minutes.",
  openGraph: {
    title: "Robin Hood",
    description: "Steal from the rich. Give to the trenches. HOOD belongs on Solana.",
    url: "https://robinhoodsol.fun",
    siteName: "Robin Hood",
    images: [
      {
        url: "/brand/robin-hood-logo.png",
        width: 512,
        height: 512,
        alt: "Robin Hood"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Robin Hood",
    description: "Creator fees buy HOOD and airdrop it to eligible holders every five minutes.",
    images: ["/brand/robin-hood-logo.png"]
  },
  icons: {
    icon: [
      { url: "/brand/robin-hood-logo.png", type: "image/png" },
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
