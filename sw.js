// Offline shell for the 140WS PPM checklist. Graph/login traffic is never cached.
const CACHE = "ppm-shell-v2";
const MSAL = "https://cdn.jsdelivr.net/npm/@azure/msal-browser@3.30.0/lib/msal-browser.min.js";
const SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", MSAL];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.url === MSAL) { // library: cache first
    e.respondWith(caches.match(MSAL).then(r => r || fetch(e.request).then(n => { const c = n.clone(); caches.open(CACHE).then(x => x.put(MSAL, c)); return n; })));
    return;
  }
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // Microsoft calls go straight to network
  // network first (so updates arrive), cache fallback when offline
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match("index.html")))
  );
});
