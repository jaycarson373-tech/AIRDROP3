import type { Metadata } from "next";
import type { Viewport } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://catinhood.fun"),
  title: "Cat in Hood",
  description: "Cat in Hood routes creator-fee rewards into HOODx Stock airdrops for eligible holders every 5 minutes.",
  openGraph: {
    title: "Cat in Hood",
    description: "Hold 1M+ and receive proportional HOODx Stock airdrops every 5 minutes.",
    url: "https://catinhood.fun",
    siteName: "Cat in Hood",
    images: [
      {
        url: "/brand/cat-in-hood-logo.png",
        width: 512,
        height: 512,
        alt: "Cat in Hood"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Cat in Hood",
    description: "5-minute proportional HOODx Stock airdrops for eligible Cat in Hood holders.",
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
