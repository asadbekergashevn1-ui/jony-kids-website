/* Jony Kids — Lidlar admin PWA service worker.
   Network-first for the app shell (admins always get the latest panel when online,
   and it still opens offline from cache). Supabase API + all POSTs go straight to the
   network and are never cached. */
const CACHE = 'jk-lidlar-v3';
const SHELL = [
  '/lidlar/',
  '/lidlar/index.html',
  '/lidlar/pwa-192.png',
  '/lidlar/pwa-512.png',
  '/lidlar/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // never touch Supabase writes / POSTs
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;        // Supabase & other hosts: straight to network
  if (!(req.mode === 'navigate' || url.pathname.startsWith('/lidlar/'))) return;

  // network-first with cache fallback (so the panel is always fresh online, usable offline)
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('/lidlar/index.html')))
  );
});
