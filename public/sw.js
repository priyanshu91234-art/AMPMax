/**
 * AMPMAX Service Worker — Static-Asset-Only Caching
 *
 * IMPORTANT: We ONLY cache static resources (images, fonts, CSS, JS bundles).
 * We NEVER cache HTML pages, navigation requests, API calls, or auth routes.
 *
 * This prevents stale cached redirects/pages from breaking authentication,
 * OAuth flows, middleware redirects, and session handling.
 *
 * Bump CACHE_VERSION on deploy to purge stale assets.
 */
const CACHE_VERSION = 'ampmax-v2';

// Only truly static, non-HTML files go here.
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
];

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ───────────────────────────────────────────────────────────────
// Purge ALL old cache versions so stale assets/pages are gone immediately.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 2. Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // 3. NEVER intercept any of these — let them go straight to the network:
  //    - Navigation requests (HTML pages, RSC payloads, redirects)
  //    - API routes (/api/*)
  //    - Auth routes (/api/auth/*, /auth/*, /login, /register)
  //    - Next.js internals (/_next/webpack-hmr, /_next/data, RSC)
  //    - Vercel internals
  if (
    request.mode === 'navigate' ||                  // any page navigation
    request.headers.get('RSC') === '1' ||            // Next.js App Router RSC payload
    request.headers.get('Next-Router-Prefetch') ||   // Next.js prefetch
    url.pathname.startsWith('/api/') ||               // all API routes
    url.pathname.startsWith('/auth/') ||              // auth pages
    url.pathname.startsWith('/login') ||              // login page
    url.pathname.startsWith('/register') ||           // register page
    url.pathname.startsWith('/dashboard') ||          // authenticated pages
    url.pathname.startsWith('/scan') ||               // authenticated pages
    url.pathname.startsWith('/pvp') ||                // authenticated pages
    url.pathname.startsWith('/progress') ||           // authenticated pages
    url.pathname.startsWith('/community') ||          // authenticated pages
    url.pathname.startsWith('/results') ||            // authenticated pages
    url.pathname.startsWith('/pricing') ||            // authenticated pages
    url.pathname.startsWith('/_next/') ||             // Next.js build assets & HMR
    url.pathname.startsWith('/_vercel/') ||           // Vercel internals
    url.pathname.includes('__nextjs')                 // Next.js debug routes
  ) {
    return; // Fall through to browser default (network fetch)
  }

  // 4. Everything that reaches here is a static asset (icons, fonts, images,
  //    CSS, client JS that isn't covered above). Use cache-first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Only cache successful, same-origin responses
        if (
          !response ||
          response.status !== 200 ||
          response.type !== 'basic'
        ) {
          return response;
        }

        const toCache = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, toCache));
        return response;
      });
      // No offline fallback — if a static asset is missing, just fail naturally.
    })
  );
});
