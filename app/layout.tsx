import type { Metadata, Viewport } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pumpmoney.fun";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Pump Money — The pump.fun Money Printer",
  description: "Hold PMONEY. Every five minutes, ten eligible wallets split a PUMP reward round.",
  alternates: { canonical: "/" },
  openGraph: { title: "PUMP MONEY.", description: "Hold longer. Sell less. Strengthen your odds.", url: SITE_URL, siteName: "Pump Money", type: "website" },
  twitter: { card: "summary_large_image", title: "PUMP MONEY.", description: "Ten wallets. Equal share. Every five minutes." }
};

export const viewport: Viewport = { themeColor: "#37ff73" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AppPolish />{children}</body></html>;
}
