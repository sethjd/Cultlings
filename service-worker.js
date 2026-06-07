const CACHE_NAME = "cultlings-v8";
const APP_FILES = [
  "./",
  "./index.html",
  "./src/styles/tokens.css",
  "./styles.css",
  "./manifest.json",
  "./assets/icons/cultlings-icon.svg",
  "./assets/svg/moon-mark.svg",
  "./assets/svg/resources/devotion.svg",
  "./assets/svg/resources/food.svg",
  "./assets/svg/resources/cursed-wood.svg",
  "./assets/svg/resources/bone-shards.svg",
  "./assets/svg/characters/player-base.svg",
  "./assets/svg/characters/follower-round.svg",
  "./assets/svg/characters/follower-long.svg",
  "./assets/svg/characters/follower-wide.svg",
  "./assets/svg/characters/follower-pointy.svg",
  "./assets/svg/characters/follower-tuft.svg",
  "./assets/svg/buildings/shrine.svg",
  "./assets/svg/buildings/hut.svg",
  "./assets/svg/buildings/ritual-circle.svg",
  "./assets/svg/buildings/kitchen.svg",
  "./assets/svg/buildings/training-pit.svg",
  "./assets/svg/buildings/relic-vault.svg",
  "./assets/svg/cosmetics/hat-soft-cap.svg",
  "./assets/svg/cosmetics/hat-candle.svg",
  "./assets/svg/cosmetics/hat-mushroom.svg",
  "./assets/svg/cosmetics/hat-bone-bow.svg",
  "./assets/svg/cosmetics/hat-twig-crown.svg",
  "./assets/svg/cosmetics/mask-bare-moon.svg",
  "./assets/svg/cosmetics/mask-wax-smile.svg",
  "./assets/svg/cosmetics/mask-bone-visor.svg",
  "./assets/svg/cosmetics/mask-mushroom.svg",
  "./assets/svg/cosmetics/mask-star-veil.svg",
  "./assets/svg/cosmetics/banner-little-moon.svg",
  "./assets/svg/cosmetics/banner-candle-teeth.svg",
  "./assets/svg/cosmetics/banner-soft-skull.svg",
  "./assets/svg/cosmetics/sigil-crooked-moon.svg",
  "./assets/svg/cosmetics/sigil-teeth.svg",
  "./assets/svg/cosmetics/sigil-mushroom-ring.svg",
  "./assets/svg/enemies/candle-goblin.svg",
  "./assets/svg/enemies/bone-beetle.svg",
  "./assets/svg/enemies/hex-wisp.svg",
  "./assets/svg/enemies/spore-imp.svg",
  "./assets/svg/enemies/bog-skull.svg",
  "./assets/svg/enemies/grave-candle.svg",
  "./assets/svg/enemies/bell-wraith.svg",
  "./assets/svg/enemies/root-grasper.svg",
  "./assets/svg/enemies/tiny-heretic.svg",
  "./assets/svg/enemies/wax-head-brute.svg",
  "./assets/svg/enemies/big-wet-prophet.svg",
  "./assets/svg/enemies/saint-hollowbell.svg",
  "./assets/svg/biomes/candlewood-decor.svg",
  "./assets/svg/biomes/moldmoon-decor.svg",
  "./assets/svg/biomes/bellbone-decor.svg",
  "./assets/svg/ui/moon-button.svg",
  "./assets/svg/ui/map-node.svg",
  "./assets/svg/ui/panel-corner.svg",
  "./src/data/gameData.js",
  "./src/data/retentionData.js",
  "./src/data/raidData.js",
  "./src/core/state.js",
  "./src/core/ui.js",
  "./src/services/audioManager.js",
  "./src/data/firebaseConfig.js",
  "./src/data/firebaseConfig.example.js",
  "./src/services/firebaseService.js",
  "./src/services/multiplayerService.js",
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
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith("/src/data/firebaseConfig.js")) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => {
        if (event.request.mode === "navigate") return caches.match("./index.html");
        return Promise.reject(new Error("Offline asset unavailable"));
      });
    })
  );
});
