const CACHE_NAME = 'skt-kontrol-v4.1';
const ASSETS = [
    '/Mini-skt/',
    '/Mini-skt/index.html',
    '/Mini-skt/style.css',
    '/Mini-skt/app.js',
    '/Mini-skt/manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
