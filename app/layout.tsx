import type { Metadata } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bullstrategy.fun"),
  title: "Bull Strategy",
  description: "Long SOL. Accumulate ANSEM. Burn BULLSTRAT. Track the live Bull Strategy airdrop engine.",
  openGraph: {
    title: "Bull Strategy",
    description: "Long SOL. Accumulate ANSEM. Burn BULLSTRAT. Track the live Bull Strategy airdrop engine.",
    url: "https://bullstrategy.fun",
    siteName: "Bull Strategy",
    images: [
      {
        url: "/brand/black-bull-logo.png",
        width: 1200,
        height: 1200,
        alt: "Bull Strategy"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Bull Strategy",
    description: "Long SOL. Accumulate ANSEM. Burn BULLSTRAT. Track the live Bull Strategy airdrop engine.",
    images: ["/brand/black-bull-logo.png"]
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
