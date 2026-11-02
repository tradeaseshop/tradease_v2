// TradeEase service worker: intentionally network-only. Clear obsolete caches
// from earlier builds, take control quickly, and never cache API or app pages.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.toLowerCase().includes('tradeease') || name.toLowerCase().includes('vite')).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', () => {
  // No interception or caching: let the browser handle requests normally.
});
