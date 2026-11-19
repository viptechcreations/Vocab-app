const CACHE_NAME = "vocabmaster-offline-v2";

// Install: Basic app shell save karega
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["./", "./index.html"]);
    })
  );
});

// Activate: Purane cache saaf karega
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Online hone par naya data layega aur Cache update karega; Offline hone par Cache se chalayega
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Firebase Realtime DB ke live logs ko cache nahi karenge
  if (req.url.includes("firebaseio.com")) return;

  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        if (networkRes && (networkRes.status === 200 || networkRes.type === "opaque")) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, resClone);
          });
        }
        return networkRes;
      })
      .catch(() => {
        return caches.match(req).then((cachedRes) => {
          if (cachedRes) return cachedRes;
          if (req.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
      })
  );
});
