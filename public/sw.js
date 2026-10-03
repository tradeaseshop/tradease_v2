// Minimal service worker, present mainly so the app qualifies as an
// installable PWA (required for wrapping it as an Android app).
//
// Deliberately does NOT cache API responses or app pages — a marketplace
// needs live prices, stock levels, and order status every time, not a
// stale cached copy. All it does is let the browser register a controller
// for this origin; every request still passes straight through to the
// network.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Intentionally no-op: let the browser handle every request normally.
});
