import type { Metadata } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  title: "$ANSEMSTR - Ansem Strategy",
  description:
    "Ansem Strategy converts creator fees into The Black Bull $ANSEM rewards for top $ANSEMSTR holders every five minutes.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png"
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
