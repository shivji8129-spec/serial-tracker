// Serial Tracker service worker: makes the app installable and opens it quickly.
// The page itself is always fetched fresh first, so a new index.html on Netlify shows up straight away.
// Database calls (Supabase) are never cached.
const CACHE = 'serial-tracker-v3';
// Paths are relative to this file, so the app works at a site root (Netlify) or in a sub-folder (GitHub Pages: /serial-tracker/)
const BASE = new URL('./', self.location).href, PAGE = BASE + 'index.html';
const SHELL = ['', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'].map(f => BASE + f);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;     // Supabase, CDNs: straight to the network
  if (req.mode === 'navigate') {                                          // the app page: network first, cache if offline
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(PAGE, copy)); return r; })
      .catch(() => caches.match(PAGE)));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));        // icons and manifest
});
