const CACHE_NAME = 'brainvita-3d-v1.6.4';
const ASSETS_TO_CACHE = [
  'index.html',
  'manifest.json',
  'https://cdn.tailwindcss.com',
  'https://i.postimg.cc/LsgKttrt/Brainvita-Icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        const canCache = networkResponse && 
                        networkResponse.status === 200 && 
                        (url.origin === self.location.origin || 
                         url.host.includes('esm.sh') || 
                         url.host.includes('postimg.cc'));

        if (canCache) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => new Response('', { status: 408 }));
    })
  );
});
