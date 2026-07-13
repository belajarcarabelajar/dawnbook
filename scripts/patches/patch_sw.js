const fs = require('fs');

// The Service Worker is currently Cache-First! 
// This is exactly why the user is completely stuck and nothing works unless they hard-refresh!
// We MUST make it Network-First as per GEMINI.md

let swContent = `
const CACHE_NAME = 'dawnbook-pwa-v3';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/typography.css',
  '/tokens.css',
  '/HubLayout.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  // Network-First strategy
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        return new Response('', { status: 408, statusText: 'Request Timeout' });
      });
    })
  );
});
`;

fs.writeFileSync('public/sw.js', swContent);
fs.writeFileSync('scripts/generate-pwa-files.js', fs.readFileSync('scripts/generate-pwa-files.js', 'utf8').replace(/dawnbook-pwa-v2/, 'dawnbook-pwa-v3'));
console.log("Patched SW");
