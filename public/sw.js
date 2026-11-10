// ClaimWise Service Worker for PWA installation and offline support
//
// Strategy:
//  • Navigations (HTML pages): network-first — always try the latest
//    deployed build; only fall back to the cache when offline. Serving
//    a stale cached page that references chunks deleted by a new
//    deployment left the installed app showing 404/broken shells.
//  • Assets (chunks, icons, fonts): stale-while-revalidate — cache is
//    fine here because Next.js chunk URLs are content-hashed.
//  • /api/ and /auth/ are never intercepted.
const CACHE_NAME = 'claimwise-pwa-v3';
const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/favicon-64.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Only manage same-origin requests. Cross-origin traffic (fonts,
  // Supabase REST, OAuth hosts…) is never intercepted — OAuth page
  // navigations must not touch this cache.
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Let the browser handle API, auth and dev routes directly
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/_next/webpack-hmr')
  ) {
    return;
  }

  // HTML navigations: network-first, cache only as offline fallback.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy);
            });
          }
          return networkResponse;
        })
        .catch(() =>
          // Offline: most recently cached copy of this page, else the
          // precached landing page.
          caches
            .match(event.request, { ignoreSearch: true })
            .then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached and update in background
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        // Fallback if offline
        return caches.match('/');
      });
    })
  );
});
