import type { Metadata } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ptf.fun"),
  title: "PTF — Pump Token Fund",
  description: "Hold 1M+ $PTF and receive weighted Pump.fun token basket airdrops every 5 minutes as the fund rotates through the strongest active tokens.",
  openGraph: {
    title: "PTF — Pump Token Fund",
    description: "Hold one token. Own the Pump.fun rotation.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ptf.fun",
    siteName: "PTF",
    images: [
      {
        url: "https://ptf.fun/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "PTF — Pump Token Fund"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "PTF — Pump Token Fund",
    description: "Weighted Pump.fun token basket drops every 5 minutes for 1M+ $PTF holders.",
    images: [
      {
        url: "https://ptf.fun/brand/og-image.png",
        alt: "PTF — Pump Token Fund"
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
