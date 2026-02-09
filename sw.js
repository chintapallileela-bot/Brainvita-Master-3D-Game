const CACHE_NAME = 'brainvita-3d-v1.6.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap',
  'https://i.postimg.cc/LsgKttrt/Brainvita-Icon.png'
];

// In production, index.tsx and other source files are bundled. 
// We should only cache files that actually exist in the final build.

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
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

  let url;
  try {
    url = new URL(event.request.url);
  } catch (e) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for navigation and primary scripts to avoid blank screens
  if (event.request.mode === 'navigate' || url.pathname.includes('index.tsx') || url.pathname.includes('index.js')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        // Only cache valid responses from the same origin or specific external CDNs
        if (networkResponse && networkResponse.status === 200 && (
            url.origin === self.location.origin || 
            url.origin.includes('esm.sh') || 
            url.origin.includes('postimg.cc') ||
            url.origin.includes('googleapis.com')
        )) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for failed fetches
        if (event.request.destination === 'image') {
          return caches.match('https://i.postimg.cc/LsgKttrt/Brainvita-Icon.png');
        }
      });
    })
  );
});