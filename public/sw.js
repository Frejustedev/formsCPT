self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let the browser do its default thing
  // for non-GET requests.
  if (event.request.method !== 'GET') return;
  // A simple pass-through fetch
  event.respondWith(fetch(event.request));
});
