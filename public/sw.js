const CACHE = 'soundscapes-cache-v1';
const PRECACHE_URLS = [
  '/audio/soundscapes/white-noise.ogg',
  '/audio/soundscapes/pink-noise.ogg',
  '/audio/soundscapes/brown-noise.ogg',
  '/audio/soundscapes/rain.ogg',
  '/audio/soundscapes/birds.ogg',
  '/audio/soundscapes/soft-keys.ogg',
  '/audio/soundscapes/lullaby.ogg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.url.includes('/audio/soundscapes/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return resp;
      }))
    );
  }
});

