/**
 * AMPMAX Service Worker — Cache-First Strategy
 * Version this string whenever you deploy significant changes so
 * old caches are automatically purged on activation.
 */
const CACHE_VERSION = 'ampmax-v1';

const APP_SHELL = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ─── Install ─────────────────────────────────────────────────────────────────
// Pre-cache the app shell so the app loads instantly after first visit.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
// Delete all old cache versions so stale assets don't linger.
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
      .then(() => self.clients.claim()) // Take control of all open pages
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
// Cache-first for static assets; network-first for API/auth routes.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extension requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Never intercept API calls, auth, or Next.js internals —
  // these must always go to the network.
  const isApiOrAuth =
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/_vercel/') ||
    url.pathname.includes('__nextjs');

  if (isApiOrAuth) {
    // Network-only for dynamic routes
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first for everything else (pages, icons, fonts, static assets)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      // Not in cache — fetch from network and store a copy
      return fetch(request)
        .then((response) => {
          // Only cache valid same-origin responses
          if (
            !response ||
            response.status !== 200 ||
            response.type === 'opaque'
          ) {
            return response;
          }

          const toCache = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, toCache));
          return response;
        })
        .catch(() => {
          // Offline fallback: serve the cached root if we have it
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
        });
    })
  );
});
