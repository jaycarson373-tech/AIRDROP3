import type { Metadata } from "next";
import type { Viewport } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://robinhood.fun"),
  title: "Robin Hood",
  description: "Steal from the rich. Give to the trenches. Robin Hood routes creator-fee rewards back to eligible holders with live proof.",
  openGraph: {
    title: "Robin Hood",
    description: "Steal from the rich. Give to the trenches. Live reward drops for the holders still in the forest.",
    url: "https://robinhood.fun",
    siteName: "Robin Hood",
    images: [
      {
        url: "/brand/robin-hood-logo.svg",
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
    description: "Steal from the rich. Give to the trenches. Live reward drops for eligible holders.",
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
