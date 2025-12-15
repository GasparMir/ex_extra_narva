const CACHE_NAME = 'camara-geo-pwa-v2';
const urlsToCache = [
    './',
    './index.html',
    './app.js',
    './styles.css',
    './manifest.json'
];

// Instalar Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Cache abierto');
            return cache.addAll(urlsToCache);
        })
    );
});

// Interceptar peticiones y servir desde caché si es posible
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).catch(() => caches.match('./index.html'));
        })
    );
});

// Limpiar cachés viejos al activar nuevo SW
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => key !== CACHE_NAME && caches.delete(key))
        ))
    );
});