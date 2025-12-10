import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Travel Puzzle - Discover Your Next Adventure",
    template: "%s | Travel Puzzle",
  },
  description: "Book amazing tours from trusted providers worldwide. Explore destinations and create unforgettable memories.",
  keywords: ["travel", "tours", "adventure", "travel agency", "book tours", "travel puzzle"],
  authors: [{ name: "Travel Puzzle" }],
  creator: "Travel Puzzle",
  publisher: "Travel Puzzle",
  metadataBase: new URL("https://www.travelpuzzle.com.mx"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.travelpuzzle.com.mx",
    siteName: "Travel Puzzle",
    title: "Travel Puzzle - Discover Your Next Adventure",
    description: "Book amazing tours from trusted providers worldwide. Explore destinations and create unforgettable memories.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Travel Puzzle",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Travel Puzzle - Discover Your Next Adventure",
    description: "Book amazing tours from trusted providers worldwide. Explore destinations and create unforgettable memories.",
    creator: "@travelpuzzle",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  verification: {
    // Add Google Search Console verification code here when available
    // google: "your-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <AppProviders>
            {children}
          </AppProviders>
        </SessionProvider>
      </body>
    </html>
  );
}
