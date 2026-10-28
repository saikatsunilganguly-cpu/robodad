// RoboDad service worker: makes the site installable and opens instantly.
// The page shell is served from cache straight away (then refreshed in the
// background), so even when the free server is asleep the app appears at once
// and shows "waking up" instead of a blank screen. Chat requests always go to
// the network.
const CACHE = "robodad-v3";
const SHELL = ["/", "/manifest.webmanifest", "/static/favicon.svg", "/static/icon-192.png", "/static/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET") return;                                   // chat, feedback
  if (url.origin === location.origin && (url.pathname.startsWith("/api/") || url.pathname === "/health")) return;

  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !isFont) return;

  // stale-while-revalidate
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const key = req.mode === "navigate" ? "/" : req;
      const cached = await cache.match(key);
      const network = fetch(req)
        .then((res) => { if (res.ok || res.type === "opaque") cache.put(key, res.clone()); return res; })
        .catch(() => cached);
      return cached || network;
    })
  );
});
