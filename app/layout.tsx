import type { Metadata } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://smi6900.fun"),
  title: "SMI6900 | The Solana Meme Index",
  description: "SMI6900 is the live Solana meme index: rotating basket assets, epoch-weighted holders and onchain index drops.",
  openGraph: {
    title: "SMI6900 | The Solana Meme Index",
    description: "The Bloomberg terminal for Solana memes: rotating basket drops, weighted holders and live onchain receipts.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://smi6900.fun",
    siteName: "SMI6900",
    images: [
      {
        url: "/brand/smi6900-logo.jpg",
        width: 1254,
        height: 1254,
        alt: "SMI6900"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "SMI6900 | The Solana Meme Index",
    description: "Rotating Solana meme baskets, live drops and epoch-weighted holders.",
    images: ["/brand/smi6900-logo.jpg"]
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/brand/smi6900-logo.png", type: "image/png" }
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
