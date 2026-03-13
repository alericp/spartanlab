// SpartanLab Service Worker - CACHE INVALIDATION MODE
// This version clears all caches and unregisters itself
// Purpose: Force browsers to fetch fresh content

const ALL_CACHE_NAMES = [
  'spartanlab-v1',
  'spartanlab-shell-v1',
  'spartanlab-v2',
  'spartanlab-shell-v2',
];

// On install, immediately activate (skip waiting)
self.addEventListener('install', (event) => {
  console.log('[SW] Installing cache-clearing service worker');
  self.skipWaiting();
});

// On activate, delete ALL caches and unregister
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating - clearing all caches');
  event.waitUntil(
    (async () => {
      // Delete all known caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
      
      // Take control of all clients
      await self.clients.claim();
      
      // Notify all clients to refresh
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => {
        client.postMessage({ type: 'CACHE_CLEARED' });
      });
      
      // Unregister this service worker
      const registration = await self.registration;
      if (registration) {
        console.log('[SW] Unregistering service worker');
        await registration.unregister();
      }
    })()
  );
});

// Fetch handler - always go to network, never serve from cache
self.addEventListener('fetch', (event) => {
  // Always fetch from network - no caching
  event.respondWith(fetch(event.request));
});

// Message handler
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
