import type { Metadata } from "next";
import type { Viewport } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://trumpstrategy.fun"),
  title: "Trump Strategy",
  description: "Trump Strategy splits holder rewards 50% WLFI and 50% TRUMP every five minutes.",
  openGraph: {
    title: "Trump Strategy",
    description: "Hold the strategy. Receive WLFI + TRUMP.",
    url: "https://trumpstrategy.fun",
    siteName: "Trump Strategy",
    images: [
      {
        url: "/brand/trump-strategy-logo.svg",
        width: 512,
        height: 512,
        alt: "Trump Strategy"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Trump Strategy",
    description: "50% WLFI. 50% TRUMP. Holder rewards every five minutes.",
    images: ["/brand/trump-strategy-logo.svg"]
  },
  icons: {
    icon: [
      { url: "/brand/trump-strategy-logo.svg", type: "image/svg+xml" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/logo.png", type: "image/png" }
    ],
    apple: "/apple-touch-icon.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#090909"
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
