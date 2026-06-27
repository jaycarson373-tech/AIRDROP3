import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "$AIRDROP - Pump Airdrop",
  description:
    "Pump Airdrop converts creator fees into PUMP rewards for top $AIRDROP holders every five minutes.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
