const CACHE_NAME = 'zakat-app-v15-final'; // تغيير الرقم مهم جداً
const OFFLINE_URL = './index.html';

const ASSETS_TO_CACHE = [
  './',
  OFFLINE_URL, // الصفحة الرئيسية
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
  self.skipWaiting(); // تفعيل فوراً
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. التفعيل: السيطرة الفورية
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
  self.clients.claim(); // السيطرة على الصفحات المفتوحة حالاً
});

// 3. الجلب: الحل السحري لمشكلة الأوفلاين
self.addEventListener('fetch', (event) => {
  
  // 🔥 الحالة الأولى: طلب فتح صفحة أو إعادة تحميل (Navigation)
  // هنا نجبره على استخدام index.html من الكاش مهما كان الرابط
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(OFFLINE_URL).then((cachedResponse) => {
        // إذا وجدنا index.html في الكاش، نرجعه فوراً
        if (cachedResponse) {
          return cachedResponse;
        }
        // إذا لم نجده (حالة نادرة)، نحاول النت
        return fetch(event.request);
      }).catch(() => {
        // إذا فشل كل شيء، ارجع للكاش مرة أخرى (أمان إضافي)
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // 🔥 الحالة الثانية: باقي الملفات (صور، سكربتات)
  // استراتيجية: الكاش أولاً، ثم التحديث في الخلفية
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

