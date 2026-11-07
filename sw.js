/* Rush Athletic — servis çalışanı: çevrimdışı uygulama kabuğu */
const CACHE = "rush-3b33e1b38c";
const SHELL = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png", "./icons/maskable-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith("rush-") && k !== "rush-ai").map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const netFirst = (req, key) => fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(key || req, cp)); } return r; }).catch(() => caches.match(key || req));
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // bulut (Supabase) istekleri her zaman ağdan
  if (req.mode === "navigate") { e.respondWith(netFirst(req, "./index.html")); return; }
  if (url.pathname.endsWith("/config.js")) { e.respondWith(netFirst(req)); return; }
  if (url.pathname.includes("/vendor/")) { // yapay zekâ modeli: ilk kullanımda indirilir, sonra çevrimdışı çalışır
    e.respondWith(caches.open("rush-ai").then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; })))); return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; })));
});
