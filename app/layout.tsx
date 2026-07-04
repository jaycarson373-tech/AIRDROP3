import type { Metadata } from "next";
import type { Viewport } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bullterminal.fun"),
  title: "Bull Terminal",
  description: "Bloomberg for the trenches. Track every Ansem thesis, live market data, AI research, and automated ANSEM holder rewards.",
  openGraph: {
    title: "Bull Terminal",
    description: "Bloomberg for the trenches. Track every Ansem thesis, live market data, AI research, and automated ANSEM holder rewards.",
    url: "https://bullterminal.fun",
    siteName: "Bull Terminal",
    images: [
      {
        url: "/brand/bull-terminal-logo.svg",
        width: 512,
        height: 512,
        alt: "Bull Terminal"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Bull Terminal",
    description: "Bloomberg for the trenches. Track every Ansem thesis, live market data, AI research, and automated ANSEM holder rewards.",
    images: ["/brand/bull-terminal-logo.svg"]
  },
  icons: {
    icon: [
      { url: "/brand/bull-terminal-logo.svg", type: "image/svg+xml" },
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
