const CACHE_NAME = 'zakat-app-v16-hybrid'; // تحديث الرقم
const OFFLINE_URL = './index.html';

const ASSETS_TO_CACHE = [
  './',
  OFFLINE_URL,
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
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // استراتيجية: اعرض الكاش فوراً، وحدث من النت في الخلفية
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        
        // 1. منطق التحديث (يعمل دائماً في الخلفية إذا وجد نت)
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // تحديث الكاش فقط إذا كان الرد سليماً
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // فشل النت؟ لا مشكلة، لا تفعل شيئاً
        });

        // 2. منطق العرض (الأولوية للكاش)
        // إذا وجدنا الملف في الكاش، نرجعه فوراً (لسرعة الأوفلاين)
        // وإلا ننتظر النت
        return cachedResponse || fetchPromise;
      });
    })
  );
});
