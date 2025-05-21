importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js');

const { precacheAndRoute, createHandlerBoundToURL } = workbox.precaching;
const { registerRoute, NavigationRoute } = workbox.routing;
const { NetworkFirst, CacheFirst } = workbox.strategies;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { ExpirationPlugin } = workbox.expiration;

precacheAndRoute(self.__WB_MANIFEST, {
  ignoreURLParametersMatching: [/.*/],
  cleanUrls: false,
});

// Cache navigation requests to index.html
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  allowlist: [/^\/.*/],
  denylist: [/\/api\/.*/],
});
registerRoute(navigationRoute);

// Cache API responses
registerRoute(
  ({ url }) => url.origin === 'https://story-api.dicoding.dev',
  new NetworkFirst({
    cacheName: 'api-responses',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache OpenStreetMap tiles
registerRoute(
  ({ url }) => url.origin.includes('tile.openstreetmap.org') || url.origin.includes('tile.openstreetmap.fr') || url.origin.includes('basemaps.cartocdn.com'),
  new CacheFirst({
    cacheName: 'map-tiles',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 10000,
        maxAgeSeconds: 90 * 24 * 60 * 60, // 90 days
      }),
    ],
  })
);

// Cache images (including marker icons and Leaflet assets)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache external resources
registerRoute(
  ({ url }) =>
    url.origin.includes('fonts.googleapis.com') ||
    url.origin.includes('fonts.gstatic.com') ||
    url.origin.includes('cdnjs.cloudflare.com'),
  new CacheFirst({
    cacheName: 'external-resources',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  let data = { title: 'New Notification', body: 'Something new happened!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      console.error('Service Worker: Failed to parse push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo.png',
      badge: '/favicon.png',
    })
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              cacheName !== 'api-responses' &&
              cacheName !== 'map-tiles' &&
              cacheName !== 'images' &&
              cacheName !== 'external-resources'
          )
          .map((cacheName) => caches.delete(cacheName))
      )
    ).then(() => self.clients.claim())
  );
});

// Notify installation
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open('images').then((cache) => {
      console.log('Service Worker: Pre-caching marker icons');
      return cache.addAll([
        '/marker-icon-2x.png',
        '/marker-icon.png',
        '/marker-shadow.png',
        '/layers-2x.png',
        '/layers.png',
      ]);
    }).catch((err) => {
      console.error('Service Worker: Failed to pre-cache marker icons:', err);
    })
  );
  self.skipWaiting();
});