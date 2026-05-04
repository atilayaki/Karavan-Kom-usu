// Self-unregistering service worker.
// Replaces any previously cached SW; once installed it deletes all caches,
// unregisters itself, and reloads open clients so they fetch fresh assets.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Wipe every cache that any older SW created.
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));

    // Unregister this SW so the page is fully un-managed next load.
    await self.registration.unregister();

    // Force every open tab to reload with fresh resources.
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      try { client.navigate(client.url); } catch {}
    }
  })());
});

// Pass everything through to the network — never serve from cache.
self.addEventListener('fetch', () => {});
