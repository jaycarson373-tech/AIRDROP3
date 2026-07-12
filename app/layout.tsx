import type { Metadata } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://pumprunner.fun"),
  title: "Pump Runner",
  description: "Pump Runner buys the active runner and airdrops that runner token to eligible $RUNNER holders.",
  openGraph: {
    title: "Pump Runner",
    description: "Pump Runner buys the active runner and airdrops that runner token to eligible $RUNNER holders.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pumprunner.fun",
    siteName: "Pump Runner",
    images: [
      {
        url: "/brand/pump-runner-banner.png",
        width: 1280,
        height: 511,
        alt: "Pump Fun Runner banner"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Pump Runner",
    description: "Pump Runner buys the active runner and airdrops that runner token to eligible $RUNNER holders.",
    images: ["/brand/pump-runner-banner.png"]
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/brand/pump-runner-logo.png", type: "image/png" }
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
