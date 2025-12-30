

const CACHE_NAME = 'zakat-app-v8.0-offline-lang'; // قم بتغيير الاسم لفرض التحديث

// قائمة الملفات التي يجب تخزينها لتعمل بدون نت
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  
  // ✅ أهم خطوة: تخزين ملفات المانيفست للغتين
  './manifest_ar.json',
  './manifest_tr.json',

  // ✅ تخزين الأيقونات (تأكد من صحة الروابط)
  'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=192,h=192,fit=crop/a5oqci6YCwpNHTpH/gemini_generated_image_l7bj58l7bj58l7bj-1-1-okXWwLISbvVl1n90.png',
  'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=192,h=192,fit=crop/a5oqci6YCwpNHTpH/__gemini_generated_image_l7bj58l7bj58l7bj---uo3o-r-o-c-1-Egn1jwHegFrVqeor.png',

  // ✅ تخزين المكتبات الخارجية (مهم جداً للعمل بدون نت)
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf-arabic@1.0.1/dist/jspdf-arabic.min.js',
  
  // الخطوط (اختياري ولكن يفضل تخزين ملف CSS الخطوط)
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Amiri:wght@400;700&display=swap'
];

// 1. تثبيت الـ Service Worker وتخزين الملفات
self.addEventListener('install', (event) => {
  self.skipWaiting(); // تفعيل التحديث فوراً
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('جاري تخزين ملفات اللغات والملفات الأساسية...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. تفعيل الـ Service Worker وحذف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('حذف الكاش القديم:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. استراتيجية جلب الملفات (Cache First, Network Fallback)
// هذه الاستراتيجية تضمن جلب الملفات من الذاكرة أولاً (للعمل بدون نت)
self.addEventListener('fetch', (event) => {
  
  // استثناء لطلبات المانيفست لضمان سرعة التبديل
  if (event.request.url.includes('manifest')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // إذا وجد الملف في الكاش، قم بإرجاعه (وضع الأوفلاين)
      if (cachedResponse) {
        return cachedResponse;
      }

      // إذا لم يوجد، حاول جلبه من النت
      return fetch(event.request).then((networkResponse) => {
        // تخزين الملف الجديد في الكاش للمستقبل
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // صفحة بديلة في حال انقطاع النت وعدم وجود الملف (اختياري)
        // return caches.match('./offline.html');
      });
    })
  );
});







