const CACHE_NAME = 'zakat-app-v11-smart-update'; // قم بتغيير الرقم عند كل تحديث كبير

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest_ar.json',
  './manifest_tr.json',
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf-arabic@1.0.1/dist/jspdf-arabic.min.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Amiri:wght@400;700&display=swap',
  'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,h=711,fit=crop/a5oqci6YCwpNHTpH/gemini_generated_image_l7bj58l7bj58l7bj-1-1-okXWwLISbvVl1n90.png',
  'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,h=711,fit=crop/a5oqci6YCwpNHTpH/__gemini_generated_image_l7bj58l7bj58l7bj---uo3o-r-o-c-1-Egn1jwHegFrVqeor.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
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
  self.clients.claim();
});

// 🔥 استراتيجية Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        
        // 1. اذهب للإنترنت لجلب النسخة الجديدة وتحديث الكاش (في الخلفية)
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // إذا كان الرابط صالحاً، قم بتحديث الكاش
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // إذا فشل النت، لا مشكلة، لدينا الكاش
        });

        // 2. إذا وجدنا الملف في الكاش، نعرضه فوراً (للسرعة)
        // ونترك fetchPromise يعمل في الخلفية لتحديث المرة القادمة
        return cachedResponse || fetchPromise;
      });
    })
  );
});
