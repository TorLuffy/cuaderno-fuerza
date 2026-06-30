/* ====== Service Worker: funcionamiento offline (PWA) ======
   Precarga los archivos de la app. Los DATOS del usuario viven en IndexedDB,
   no aquí: este caché solo guarda el "programa", nunca información personal. */

const CACHE = "cuaderno-fuerza-v1";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./src/css/styles.css",
  "./src/js/app.js",
  "./src/js/db.js",
  "./src/js/seed.js",
  "./src/js/utils.js",
  "./src/js/charts.js",
  "./src/js/pin.js",
  "./src/js/export.js",
  "./src/js/views/entreno.js",
  "./src/js/views/recuperacion.js",
  "./src/js/views/comida.js",
  "./src/js/views/habitos.js",
  "./src/js/views/peso.js",
  "./src/js/views/progreso.js",
  "./src/assets/icon-192.png",
  "./src/assets/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estrategia: cache-first con respaldo a red (y actualización en segundo plano)
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then((cacheado) => {
      const red = fetch(req).then((resp) => {
        if (resp && resp.status === 200 && resp.type === "basic") {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return resp;
      }).catch(() => cacheado);
      return cacheado || red;
    })
  );
});
