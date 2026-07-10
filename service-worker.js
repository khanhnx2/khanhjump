const CACHE_NAME = 'khanh-jump-android-v28';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './styles-characters.css',
  './styles-leaderboard.css',
  './styles-powerups.css',
  './styles-matching.css',
  './styles-about.css',
  './styles-landscape.css',
  './manifest.webmanifest',
  './assets/android-icon-192.png',
  './assets/android-icon-512.png',
  './assets/android-icon.svg',
  './assets/characters/player-father.png',
  './assets/characters/player-khoi.png',
  './assets/characters/player-nguyen.png',
  './js/main.js',
  './js/about-screen.js',
  './js/audio-manager.js',
  './js/background-parallax.js',
  './js/character-manager.js',
  './js/character-level-progress.js',
  './js/collision-detection.js',
  './js/game-state.js',
  './js/hud-progress.js',
  './js/leaderboard.js',
  './js/level-data.js',
  './js/obstacle-renderer.js',
  './js/particle-effects.js',
  './js/projectile-collision.js',
  './js/power-up-renderer.js',
  './js/beginner-word-bank.js',
  './js/matching-game.js',
  './js/player-cube.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        const responseCopy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
        return networkResponse;
      });
    })
  );
});
