const CACHE_NAME = "cultlings-v2";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.json",
  "./assets/icons/cultlings-icon.svg",
  "./assets/svg/moon-mark.svg",
  "./src/data/gameData.js",
  "./src/core/state.js",
  "./src/core/ui.js",
  "./src/screens/titleScreen.js",
  "./src/screens/campScreen.js",
  "./src/entities/raidActors.js",
  "./src/screens/raidScreen.js",
  "./src/screens/resultsScreen.js",
  "./src/main.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
