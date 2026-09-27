// TradeEase network-only service worker.
// It exists for PWA/TWA installability and intentionally does not cache pages,
// API responses, prices, stock, orders, or product data.
const VERSION = 'tradease-network-only-v3';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Remove caches left by older TradeEase PWA versions so an old cached
    // bundle cannot survive a deployment.
    if ('caches' in self) {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== VERSION).map((name) => caches.delete(name)));
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', () => {
  // Network-only: deliberately do not call caches.match() or cache responses.
});
