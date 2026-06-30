import type { Metadata } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://thenietzscheanbull.fun"),
  title: "The Nietzschean Bull",
  description: "The Bull rewards conviction. Hold BULL, stay eligible, and receive automatic ANSEM distributions every five minutes.",
  openGraph: {
    title: "The Nietzschean Bull",
    description: "The Bull rewards conviction. Hold BULL, stay eligible, and receive automatic ANSEM distributions every five minutes.",
    url: "https://thenietzscheanbull.fun",
    siteName: "The Nietzschean Bull",
    images: [
      {
        url: "/brand/nietzschean-hero.webp",
        width: 1200,
        height: 780,
        alt: "The Nietzschean Bull"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "The Nietzschean Bull",
    description: "The Bull rewards conviction. Hold BULL, stay eligible, and receive automatic ANSEM distributions every five minutes.",
    images: ["/brand/nietzschean-hero.webp"]
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
