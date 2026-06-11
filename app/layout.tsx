import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { InstallPrompt } from "@/components/layout/InstallPrompt";
import { ServiceWorkerRegistrar } from "@/components/layout/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "AMPMAX — Know Your Level. Elevate Your Existence.",
  description:
    "AI-powered facial analysis. Get a brutally honest rating, tier classification, and a personalized improvement roadmap. Compete in PVP. Track your progress.",
  keywords: ["face rating", "facial analysis", "AI beauty", "looksmaxing", "AMPMAX"],
  authors: [{ name: "AMPMAX" }],

  // ── PWA / manifest ──────────────────────────────────────────────────────
  manifest: "/manifest.json",

  // Apple-specific PWA metadata (handled via <meta> tags in <head>)
  appleWebApp: {
    capable: true,
    title: "AMPMAX",
    statusBarStyle: "black-translucent",
  },

  // Open Graph
  openGraph: {
    title: "AMPMAX — Know Your Level",
    description: "AI-powered facial analysis and rating app",
    type: "website",
    siteName: "AMPMAX",
  },

  // Twitter card
  twitter: {
    card: "summary",
    title: "AMPMAX — Know Your Level",
    description: "AI-powered facial analysis and rating app",
  },

  // Indexing
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
  // No viewportFit here — we handle safe-area via CSS env()
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* ── PWA meta tags ──────────────────────────────────────────────── */}

        {/* Android / Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS Safari */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AMPMAX" />

        {/* iOS home screen icons (need explicit links — Next metadata API
            doesn't cover all sizes for Safari) */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128x128.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/icon-72x72.png" />

        {/* Splash screen colour for iOS */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Standard favicon chain */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />

        {/* Microsoft Tiles */}
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-TileColor" content="#000000" />
      </head>
      <body className="noise-overlay">
        <SessionProvider>
          {children}
          {/* PWA: service worker registration (render-nothing, client-only) */}
          <ServiceWorkerRegistrar />
          {/* PWA: native Android prompt + iOS install banner */}
          <InstallPrompt />
        </SessionProvider>
      </body>
    </html>
  );
}
