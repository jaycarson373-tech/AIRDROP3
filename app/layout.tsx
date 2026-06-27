import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "$AIRDOP - Pump Airdrop",
  description:
    "Pump Airdrop converts creator fees into PUMP rewards for top $AIRDOP holders every five minutes.",
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
