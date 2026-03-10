// sw.js - Service Worker para News Minimal PWA
// Estrategia: Cache-first para assets, Network-first para noticias

const CACHE_NAME = 'news-minimal-v1';
const STATIC_ASSETS = [
  '/news-minimal-pwa/',
  '/news-minimal-pwa/index.html',
  '/news-minimal-pwa/styles.css',
  '/news-minimal-pwa/app.js',
  '/news-minimal-pwa/manifest.json',
  // Fallback offline
  '/news-minimal-pwa/offline.html'
];

// Instalación: precachear assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Precacheando assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar caches viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: estrategia híbrida
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Si es una petición a API de noticias (simulada o real)
  if (url.pathname.includes('/api/news') || url.hostname.includes('workers.dev')) {
    // Network-first para contenido fresco
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clonar para cachear
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback a caché si está offline
          return caches.match(request);
        })
    );
  } else {
    // Cache-first para assets estáticos
    event.respondWith(
      caches.match(request)
        .then((cached) => cached || fetch(request))
    );
  }
});

// Mensajería para actualizar UI de estado offline
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
