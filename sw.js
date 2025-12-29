const CACHE_NAME = 'zakat-app-v 5.2';
// الملفات التي سيتم تخزينها مؤقتاً (CSS, JS, Images)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest_ar.json', // إضافة ملف المانيفست العربي
  './manifest_tr.json', // إضافة ملف المانيفست التركي
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf-arabic@1.0.1/dist/jspdf-arabic.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // فرض التحديث فوراً
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // السيطرة الفورية على الصفحات المفتوحة
});

self.addEventListener('fetch', (event) => {
  // استراتيجية Network First لملف HTML لضمان التحديث الفوري
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // استراتيجية Cache First للملفات الثابتة (صور، مكتبات)
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});



















