import type { Metadata } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://returntopump.fun"),
  title: "Return to Pump",
  description: "Return to Pump claims creator fees, buys $PUMP, and pays eligible RTP holders automatically every 10 minutes.",
  openGraph: {
    title: "Return to Pump",
    description: "Return to Pump claims creator fees, buys $PUMP, and pays eligible RTP holders automatically every 10 minutes.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://returntopump.fun",
    siteName: "Return to Pump",
    images: [
      {
        url: "/brand/return-to-pump-banner.png",
        width: 1280,
        height: 399,
        alt: "Return to Pump"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Return to Pump",
    description: "Return to Pump claims creator fees, buys $PUMP, and pays eligible RTP holders automatically every 10 minutes.",
    images: ["/brand/return-to-pump-banner.png"]
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
