// Minimal Service Worker to satisfy PWA install criteria
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Simple pass-through fetch
    event.respondWith(fetch(event.request));
});
