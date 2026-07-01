import type { Metadata } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://robinhood.fun"),
  title: "Robin Hood",
  description: "Steal from the rich. Give to the trenches. Hold HOOD and receive automatic reward distributions.",
  openGraph: {
    title: "Robin Hood",
    description: "Steal from the rich. Give to the trenches. Hold HOOD and receive automatic reward distributions.",
    url: "https://robinhood.fun",
    siteName: "Robin Hood",
    images: [
      {
        url: "/brand/robin-hood-hero.jpg",
        width: 1200,
        height: 780,
        alt: "Robin Hood"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Robin Hood",
    description: "Steal from the rich. Give to the trenches. Hold HOOD and receive automatic reward distributions.",
    images: ["/brand/robin-hood-hero.jpg"]
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
