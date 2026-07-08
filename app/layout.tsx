import type { Metadata } from "next";
import type { Viewport } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hoodstrategy.fun"),
  title: "Hood Strategy",
  description: "Hood Strategy routes rewards into 50/50 HOOD holder airdrops and verified holder live draws.",
  openGraph: {
    title: "Hood Strategy",
    description: "Hold 1M+ HOOD for automatic drops, verify ownership for live draw prizes.",
    url: "https://hoodstrategy.fun",
    siteName: "Hood Strategy",
    images: [
      {
        url: "/brand/robin-hood-logo.svg",
        width: 512,
        height: 512,
        alt: "Hood Strategy"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Hood Strategy",
    description: "50/50 HOOD airdrops for holders and verified Hood community draws.",
    images: ["/brand/robin-hood-logo.svg"]
  },
  icons: {
    icon: [
      { url: "/brand/robin-hood-logo.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/logo.png", type: "image/png" }
    ],
    apple: "/apple-touch-icon.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#000000"
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
