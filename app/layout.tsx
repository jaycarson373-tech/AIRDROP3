import type { Metadata } from "next";
import { AppPolish } from "./app-polish";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ansemfy.fun"),
  title: "ANSEMIFICATION",
  description: "The initiation into the Cult of Ansem. Tag @Ansemfy_ on X, receive your Ansemified PFP, and join the army.",
  openGraph: {
    title: "ANSEMIFICATION",
    description: "The initiation into the Cult of Ansem. Tag @Ansemfy_ on X, receive your Ansemified PFP, and join the army.",
    url: "https://ansemfy.fun",
    siteName: "ANSEMFY",
    images: [
      {
        url: "/brand/ansemfy-logo.jpg",
        width: 1254,
        height: 1254,
        alt: "ANSEMFY"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "ANSEMIFICATION",
    description: "The initiation into the Cult of Ansem. Tag @Ansemfy_ on X, receive your Ansemified PFP, and join the army.",
    images: ["/brand/ansemfy-logo.jpg"]
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
