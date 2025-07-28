const CACHE_NAME = "karaoke-for-jellyfin-v2";
const STATIC_CACHE = "karaoke-static-v2";
const DYNAMIC_CACHE = "karaoke-dynamic-v2";

// Static assets that rarely change
const STATIC_ASSETS = [
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/favicon.ico",
  "/apple-touch-icon.png",
];

// Pages that should use network-first strategy
const NETWORK_FIRST_ROUTES = ["/", "/tv", "/admin", "/clear-cache"];

// API routes that should always be fresh
const API_ROUTES = ["/api/"];

// Install event - cache static resources
self.addEventListener("install", event => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE);
      await staticCache.addAll(STATIC_ASSETS);
      console.log("Service Worker: Static assets cached");

      // Skip waiting to activate immediately
      self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches and take control
self.addEventListener("activate", event => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== STATIC_CACHE &&
            cacheName !== DYNAMIC_CACHE
          ) {
            console.log("Service Worker: Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );

      // Take control of all clients immediately
      await self.clients.claim();
      console.log("Service Worker: Activated and claimed clients");
    })()
  );
});

// Fetch event - implement different caching strategies
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // API routes - always fetch fresh
    if (API_ROUTES.some(route => pathname.startsWith(route))) {
      return await networkOnly(request);
    }

    // Static assets - cache first
    if (STATIC_ASSETS.some(asset => pathname === asset)) {
      return await cacheFirst(request, STATIC_CACHE);
    }

    // Main pages - network first with cache fallback
    if (
      NETWORK_FIRST_ROUTES.some(
        route => pathname === route || pathname.startsWith(route)
      )
    ) {
      return await networkFirst(request, DYNAMIC_CACHE);
    }

    // JavaScript, CSS, and other assets - stale while revalidate
    if (
      pathname.includes("/_next/") ||
      pathname.endsWith(".js") ||
      pathname.endsWith(".css")
    ) {
      return await staleWhileRevalidate(request, DYNAMIC_CACHE);
    }

    // Default to network first
    return await networkFirst(request, DYNAMIC_CACHE);
  } catch (error) {
    console.error("Service Worker: Fetch error:", error);
    return new Response("Network error", { status: 503 });
  }
}

// Network only strategy
async function networkOnly(request) {
  return await fetch(request);
}

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.status === 200) {
    cache.put(request, response.clone());
  }
  return response;
}

// Network first strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      // Cache successful responses
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Network failed, try cache
    const cached = await cache.match(request);
    if (cached) {
      console.log(
        "Service Worker: Serving from cache (network failed):",
        request.url
      );
      return cached;
    }
    throw error;
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch in background to update cache
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(error => {
      console.log("Service Worker: Background fetch failed:", error);
    });

  // Return cached version immediately if available
  if (cached) {
    return cached;
  }

  // If no cache, wait for network
  return await fetchPromise;
}

// Listen for messages from the main thread
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    clearAllCaches()
      .then(() => {
        event.ports[0].postMessage({ success: true });
      })
      .catch(error => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
  }

  if (event.data && event.data.type === "GET_CACHE_INFO") {
    getCacheInfo().then(info => {
      event.ports[0].postMessage(info);
    });
  }
});

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log("Service Worker: All caches cleared");
}

// Get cache information
async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const info = {};

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    info[name] = keys.length;
  }

  return info;
}
