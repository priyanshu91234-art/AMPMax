import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { DownloadAppButton } from "@/components/layout/DownloadAppButton";

export const metadata: Metadata = {
  title: "AMPMAX — Know Your Level. Elevate Your Existence.",
  description:
    "AI-powered facial analysis. Get a brutally honest rating, tier classification, and a personalized improvement roadmap. Compete in PVP. Track your progress.",
  keywords: ["face rating", "facial analysis", "AI beauty", "looksmaxing", "AMPMAX"],
  authors: [{ name: "AMPMAX" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AMPMAX",
  },
  openGraph: {
    title: "AMPMAX — Know Your Level",
    description: "AI-powered facial analysis and rating app",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="noise-overlay">
        <SessionProvider>
          {children}
          <DownloadAppButton />
        </SessionProvider>
      </body>
    </html>
  );
}
