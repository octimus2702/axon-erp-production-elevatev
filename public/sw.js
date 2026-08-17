// Service Worker para Axon ERP Gestor
const CACHE_NAME = 'axon-erp-gestor-pwa-v3';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/icon.svg'
];

// 1. Instalar Service Worker y precachear el App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Precaching App Shell');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activar Service Worker y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Eliminando caché obsoleta:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Estrategia de respuesta Fetch con soporte Offline completo
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignorar peticiones a APIs externas (CriptoYa, DolarApi, Google Apps Script, etc.)
  // para que el navegador las maneje directamente sin intervención del Service Worker
  if (url.origin !== self.location.origin) {
    return;
  }

  // Para peticiones de navegación de páginas HTML
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Si hay conexión, guardamos la versión actualizada en caché
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Si falla la red (offline), servimos index.html desde la caché
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // Para estáticos (JS, CSS, Imágenes, Fuentes, SVG, PNG): Caché primero con actualización de fondo
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retornamos caché y actualizamos en segundo plano si hay red
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => { /* Red no disponible, se mantiene la respuesta de caché */ });
        return cachedResponse;
      }

      // Si no está en caché, ir a la red de forma segura
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch((err) => {
          // Silencioso ante desconexión o fallas de red
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
    })
  );
});
