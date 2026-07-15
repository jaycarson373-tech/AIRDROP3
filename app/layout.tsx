import type { Metadata } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://smi6900.fun"),
  title: "SMI6900",
  description: "SMI6900 is a Solana meme index that rotates current drop assets, builds a 6900 basket and airdrops weighted rewards to eligible $SMI6900 holders.",
  openGraph: {
    title: "SMI6900",
    description: "SMI6900 rotates meme index assets and airdrops basket rewards to eligible holders.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://smi6900.fun",
    siteName: "SMI6900",
    images: [
      {
        url: "/airdrop-bg.png",
        width: 1280,
        height: 720,
        alt: "SMI6900"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "SMI6900",
    description: "The Solana meme index for 6900 culture, live basket drops and epoch-weighted holders.",
    images: ["/airdrop-bg.png"]
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/airdrop-bg.png", type: "image/png" }
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
