import type { Metadata } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://the-robin-hood.fun"),
  title: "The Robin Hood",
  description: "The Robin Hood claims creator fees, buys HOODx, and pays eligible HOOD holders automatically every 5 minutes.",
  openGraph: {
    title: "The Robin Hood",
    description: "The Robin Hood claims creator fees, buys HOODx, and pays eligible HOOD holders automatically every 5 minutes.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://the-robin-hood.fun",
    siteName: "The Robin Hood",
    images: [
      {
        url: "/logo.png",
        width: 1254,
        height: 1254,
        alt: "The Robin Hood"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "The Robin Hood",
    description: "The Robin Hood claims creator fees, buys HOODx, and pays eligible HOOD holders automatically every 5 minutes.",
    images: ["/logo.png"]
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
