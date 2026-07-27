// service-worker.js — offline support for Curio.
// Strategy:
//   app shell (HTML/CSS/JS/icons)  -> cache-first, refreshed in the background
//   content APIs (wiki* / semanticscholar) -> network-first, cached as offline fallback
//   images (mostly Wikipedia thumbnails)   -> cache-first
//   everything else (e.g. Google Fonts)    -> stale-while-revalidate

const VERSION = 'v15';
const SHELL_CACHE = `curio-shell-${VERSION}`;
const RUNTIME_CACHE = `curio-runtime-${VERSION}`;
const IMAGE_CACHE = `curio-images-${VERSION}`;
const KNOWN_CACHES = [SHELL_CACHE, RUNTIME_CACHE, IMAGE_CACHE];

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/feed.js',
  './js/sources.js',
  './js/topics.js',
  './js/curated.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !KNOWN_CACHES.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isApiRequest(url) {
  return /(^|\.)wikipedia\.org$/.test(url.hostname)
    || /(^|\.)wikiquote\.org$/.test(url.hostname)
    || /(^|\.)wikimedia\.org$/.test(url.hostname)
    || /(^|\.)semanticscholar\.org$/.test(url.hostname)
    || /(^|\.)archive\.org$/.test(url.hostname)
    || /(^|\.)ncbi\.nlm\.nih\.gov$/.test(url.hostname);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!url.protocol.startsWith('http')) return; // e.g. chrome-extension:, unsupported by Cache Storage

  // Same-origin app shell: cache-first, update cache in the background
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }).catch(() => cached || Response.error());
        return cached || network;
      })
    );
    return;
  }

  // Content APIs: network-first so the feed stays live; cache as an offline fallback
  if (isApiRequest(url)) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req).then((cached) => cached || Response.error()))
    );
    return;
  }

  // Images: cache-first for speed and offline reading of already-seen cards
  if (req.destination === 'image') {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(IMAGE_CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached || Response.error()))
    );
    return;
  }

  // Everything else (fonts, etc.): stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached || Response.error());
      return cached || network;
    })
  );
});
