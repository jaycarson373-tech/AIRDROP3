import type { Metadata } from "next";
import type { Viewport } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bullify.fun"),
  title: "Bullify",
  description: "Bullification for the Black Bull Army. Tag @Bullify_ on X, receive a Bullified PFP, and earn automated ANSEM rewards.",
  openGraph: {
    title: "Bullify",
    description: "Bullification for the Black Bull Army. Tag @Bullify_ on X, receive a Bullified PFP, and earn automated ANSEM rewards.",
    url: "https://bullify.fun",
    siteName: "Bullify",
    images: [
      {
        url: "/brand/bullify-logo.png",
        width: 1254,
        height: 1254,
        alt: "Bullify"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Bullify",
    description: "Bullification for the Black Bull Army. Tag @Bullify_ on X, receive a Bullified PFP, and earn automated ANSEM rewards.",
    images: ["/brand/bullify-logo.png"]
  },
  icons: {
    icon: [
      { url: "/brand/bullify-logo.png", type: "image/png" },
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
