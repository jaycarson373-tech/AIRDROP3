import type { Metadata } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://copycat.fun"),
  title: "Copy Cat",
  description: "Copy Cat aggregates smart-wallet scans, buys the active scan with fees and airdrops it to eligible $COPYCAT holders.",
  openGraph: {
    title: "Copy Cat",
    description: "Copy Cat aggregates smart-wallet scans, buys the active scan with fees and airdrops it to eligible $COPYCAT holders.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://copycat.fun",
    siteName: "Copy Cat",
    images: [
      {
        url: "/brand/copy-cat-background.jpg",
        width: 1280,
        height: 720,
        alt: "Copy Cat"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Copy Cat",
    description: "Copy Cat aggregates smart-wallet scans, buys the active scan with fees and airdrops it to eligible $COPYCAT holders.",
    images: ["/brand/copy-cat-background.jpg"]
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/brand/copy-cat-logo.png", type: "image/png" }
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
