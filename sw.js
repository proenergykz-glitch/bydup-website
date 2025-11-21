const CACHE_NAME = 'byd-services-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', function(event) {
  // Принудительная активация нового Service Worker
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', function(event) {
  // Принудительно активируем новый Service Worker
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all([
        // Удаляем все старые кэши
        ...cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
        // Активируем новый Service Worker для всех клиентов
        self.clients.claim()
      ]);
    })
  );
});

// Перехват запросов
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});


