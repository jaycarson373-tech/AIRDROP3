import type { Metadata } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ansemfy.fun"),
  title: "ANSEMFY",
  description: "Become part of the movement. ANSEMFY generates Ansem-style PFPs and airdrops ANSEM to eligible holders.",
  openGraph: {
    title: "ANSEMFY",
    description: "Become part of the movement. ANSEMFY generates Ansem-style PFPs and airdrops ANSEM to eligible holders.",
    url: "https://ansemfy.fun",
    siteName: "ANSEMFY",
    images: [
      {
        url: "/brand/ansem-black-bull.jpg",
        width: 1200,
        height: 1200,
        alt: "ANSEMFY"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "ANSEMFY",
    description: "Become part of the movement. ANSEMFY generates Ansem-style PFPs and airdrops ANSEM to eligible holders.",
    images: ["/brand/ansem-black-bull.jpg"]
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
