// Simple, reliable Service Worker without Workbox dependencies
const CACHE_NAME = 'story-app-v1';
const API_CACHE = 'api-cache-v1';
const STATIC_CACHE = 'static-cache-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/favicon.png',
  '/logo.png',
  '/manifest.json',
  '/placeholder.png',
  '/marker-icon-2x.png',
  '/marker-icon.png',
  '/marker-shadow.png',
  '/layers-2x.png',
  '/layers.png'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES).catch((error) => {
          console.error('Service Worker: Failed to cache some static files:', error);
          // Continue even if some files fail to cache
          return Promise.resolve();
        });
      }),
      caches.open(API_CACHE).then((cache) => {
        console.log('Service Worker: API cache opened');
        return Promise.resolve();
      })
    ]).then(() => {
      console.log('Service Worker: Installation completed');
      self.skipWaiting();
    }).catch((error) => {
      console.error('Service Worker: Installation failed:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  const expectedCaches = [CACHE_NAME, API_CACHE, STATIC_CACHE, 'image-cache-v1'];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const deletePromises = cacheNames
        .filter((cacheName) => !expectedCaches.includes(cacheName))
        .map((cacheName) => {
          console.log('Service Worker: Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        });
      
      return Promise.all(deletePromises);
    }).then(() => {
      console.log('Service Worker: Activation completed');
      return self.clients.claim();
    }).catch((error) => {
      console.error('Service Worker: Activation failed:', error);
    })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle image requests from API (cache these separately)
  if (url.origin === 'https://story-api.dicoding.dev' && 
      (url.pathname.includes('/images/') || 
       request.destination === 'image' ||
       /\.(jpg|jpeg|png|gif|webp|blob)$/i.test(url.pathname))) {
    event.respondWith(handleImageRequest(request));
    return;
  }
  
  // Handle other API requests
  if (url.origin === 'https://story-api.dicoding.dev') {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // Handle map tile requests
  if (url.origin.includes('tile.openstreetmap.org') || 
      url.origin.includes('tile.openstreetmap.fr') || 
      url.origin.includes('basemaps.cartocdn.com')) {
    event.respondWith(handleMapTileRequest(request));
    return;
  }
  
  // Handle static files and navigation
  event.respondWith(handleStaticRequest(request));
});

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  const IMAGE_CACHE = 'image-cache-v1';
  
  try {
    // Try cache first for images
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Serving image from cache:', request.url);
      return cachedResponse;
    }
    
    // Fallback to network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful image responses
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, networkResponse.clone()).catch((error) => {
        console.warn('Failed to cache image:', error);
      });
      console.log('Image cached from network:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Failed to load image:', request.url, error);
    
    // Return placeholder image for failed requests
    try {
      const placeholderResponse = await caches.match('/placeholder.png');
      if (placeholderResponse) {
        return placeholderResponse;
      }
    } catch (placeholderError) {
      console.warn('Placeholder image not available:', placeholderError);
    }
    
    // Return a simple 1x1 transparent image as last resort
    const transparentPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    return new Response(transparentPixel, {
      status: 200,
      headers: { 'Content-Type': 'image/png' }
    });
  }
}
// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone()).catch((error) => {
        console.warn('Failed to cache API response:', error);
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed for API request, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return error response if no cache available
    return new Response(JSON.stringify({ error: 'Network unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle map tiles with cache-first strategy
async function handleMapTileRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the tile
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone()).catch((error) => {
        console.warn('Failed to cache map tile:', error);
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Failed to load map tile:', request.url);
    
    // Return a placeholder or error response
    return new Response('', { status: 503 });
  }
}

// Handle static files and navigation
async function handleStaticRequest(request) {
  try {
    // For navigation requests, always try network first
    if (request.mode === 'navigate') {
      try {
        const networkResponse = await fetch(request);
        return networkResponse;
      } catch (error) {
        // Fallback to cached index.html for navigation
        const cachedResponse = await caches.match('/index.html');
        if (cachedResponse) {
          return cachedResponse;
        }
      }
    }
    
    // Try cache first for static resources
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok && isStaticResource(request.url)) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone()).catch((error) => {
        console.warn('Failed to cache static resource:', error);
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Failed to handle static request:', request.url);
    
    // For navigation, return cached index.html
    if (request.mode === 'navigate') {
      const cachedIndex = await caches.match('/index.html');
      if (cachedIndex) {
        return cachedIndex;
      }
    }
    
    return new Response('Resource not available offline', { status: 503 });
  }
}

// Check if URL is a static resource that should be cached
function isStaticResource(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.json', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.includes(ext));
}

// In the push event handler in sw.js
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  
  // Don't proceed if permission isn't granted
  event.waitUntil(
    Notification.permission === 'granted'.then((permission) => {
      if (permission !== 'granted') {
        console.log('No notification permission, skipping push');
        return;
      }
      
      let data = { 
        title: 'New Notification', 
        body: 'Something new happened!' 
      };
      
      if (event.data) {
        try {
          data = event.data.json();
        } catch (error) {
          console.error('Service Worker: Failed to parse push data:', error);
        }
      }

      return self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/logo.png',
        badge: '/favicon.png',
      }).catch((error) => {
        console.error('Service Worker: Failed to show notification:', error);
      });
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    self.clients.openWindow('/').catch((error) => {
      console.error('Service Worker: Failed to open window:', error);
    })
  );
});

console.log('Service Worker: Script loaded successfully');