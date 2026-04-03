const CACHE_NAME = 'liveat-v2';
const urlsToCache = [
  '/',
  '/index.html',
];

// Force update on new version install
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Claim clients immediately
      await self.clients.claim();
      // Delete old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Rule 1: Always use network for non-GET methods (POST, PUT, DELETE)
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Rule 2: Always use network for API, Supabase, and WebSockets
  if (
    url.pathname.startsWith('/api') || 
    url.hostname.includes('supabase.co') ||
    event.request.headers.get('Upgrade') === 'websocket' ||
    url.pathname.includes('/auth/')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Rule 3: Cache-first strategy for static assets
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(event.request);
        
        // Cache valid responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // Fallback for failed network requests
        return caches.match('/');
      }
    })()
  );
});
