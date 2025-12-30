const CACHE_NAME = 'zakat-app-v12-final-offline'; // تغيير الرقم ضروري

const ASSETS_TO_CACHE = [
  './',
  './index.html', // هذا هو أهم ملف
  './manifest_ar.json',
  './manifest_tr.json',
  // المكتبات
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf-arabic@1.0.1/dist/jspdf-arabic.min.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Amiri:wght@400;700&display=swap',
  // الصور
  'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,h=711,fit=crop/a5oqci6YCwpNHTpH/gemini_generated_image_l7bj58l7bj58l7bj-1-1-okXWwLISbvVl1n90.png',
  'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,h=711,fit=crop/a5oqci6YCwpNHTpH/__gemini_generated_image_l7bj58l7bj58l7bj---uo3o-r-o-c-1-Egn1jwHegFrVqeor.png'
];

// 1. التثبيت: تخزين الملفات بقوة
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching App Shell...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. التفعيل: تنظيف القديم
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

// 3. الجلب: الاستراتيجية الصارمة (Cache First for Navigation)
self.addEventListener('fetch', (event) => {
  
  // أ) إذا كان الطلب هو "فتح الصفحة" أو "إعادة التحميل" (Navigation)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((response) => {
        // إذا وجدنا الصفحة في الكاش، نرجعها فوراً ولا نحاول الاتصال بالنت
        // هذا يمنع ظهور صفحة "لا يوجد اتصال"
        return response || fetch(event.request);
      }).catch(() => {
        // خط الأمان الأخير
        return caches.match('./index.html');
      })
    );
    return; // انتهى هنا، لا تكمل الكود
  }

  // ب) لباقي الملفات (صور، سكربتات) - استراتيجية Stale-While-Revalidate
  // نعرض القديم فوراً، ونحدث في الخلفية إذا كان هناك نت
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {}); // تجاهل أخطاء النت

      return cachedResponse || fetchPromise;
    })
  );
});
