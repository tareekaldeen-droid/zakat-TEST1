const CACHE_NAME = 'zakat-app-v9.0-offline-final'; // قمنا بتحديث الإصدار

// الملفات الأساسية التي يجب تخزينها فوراً
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest_ar.json',
  './manifest_tr.json',
  // أضف هنا أي ملفات CSS أو JS محلية أخرى إن وجدت
  // الروابط الخارجية (CDN)
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf-arabic@1.0.1/dist/jspdf-arabic.min.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Amiri:wght@400;700&display=swap',
  // صور اللوجو (مهمة جداً لعدم ظهور إشارة كسر الصورة)
  'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,h=711,fit=crop/a5oqci6YCwpNHTpH/gemini_generated_image_l7bj58l7bj58l7bj-1-1-okXWwLISbvVl1n90.png',
  'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,h=711,fit=crop/a5oqci6YCwpNHTpH/__gemini_generated_image_l7bj58l7bj58l7bj---uo3o-r-o-c-1-Egn1jwHegFrVqeor.png'
];

// 1. التثبيت (Install): تخزين الملفات في الكاش
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('جاري تخزين ملفات التطبيق...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. التفعيل (Activate): تنظيف الكاش القديم
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

// 3. الجلب (Fetch): هنا يكمن السحر لعمل التطبيق بدون نت
self.addEventListener('fetch', (event) => {
  
  // أ) استراتيجية خاصة لملف HTML الرئيسي (Navigation Request)
  // الهدف: حاول النت أولاً للتحديث، إذا فشل -> اذهب للكاش فوراً (بدون صفحة خطأ)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            // تحديث نسخة الكاش بالنسخة الجديدة من النت
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // 🔥 هنا الحل: إذا فشل النت، أعد صفحة index.html من الكاش بدلاً من صفحة الخطأ
          return caches.match('./index.html');
        })
    );
    return;
  }

  // ب) استراتيجية خاصة للملفات الثابتة (صور، سكربتات، مانيفست)
  // الهدف: الكاش أولاً للسرعة القصوى، ثم النت إذا لم يوجد
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // تخزين أي ملف جديد يتم جلبه
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
