const CACHE_NAME = 'zakat-app-v6.9-offline-fix'; // قمت بتغيير الاسم لتحديث الكاش

// قائمة الملفات التي يجب تخزينها ليعمل التطبيق بدون نت
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest_ar.json',
  './manifest_tr.json',
  './notifications.json',
  // المكتبات الخارجية (مهمة جداً ليعمل التطبيق وشكله بدون نت)
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf-arabic@1.0.1/dist/jspdf-arabic.min.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Amiri:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Amiri&family=Lateef&family=Cairo&family=Roboto&family=Merriweather&family=Pacifico&display=swap'
];

// 1. تثبيت Service Worker وتخزين الملفات
self.addEventListener('install', (event) => {
  self.skipWaiting(); // تفعيل التحديث فوراً دون انتظار إغلاق التبويب
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('تم فتح الكاش وتخزين الملفات');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. تفعيل Service Worker وتنظيف الكاش القديم
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
    }).then(() => self.clients.claim()) // السيطرة على الصفحة فوراً
  );
});

// 3. استراتيجية جلب البيانات (الكاش أولاً، ثم الشبكة)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // إذا وجد الملف في الكاش، قم بإرجاعه فوراً (وضع الأوفلاين)
      if (cachedResponse) {
        return cachedResponse;
      }

      // إذا لم يوجد، حاول جلبه من الإنترنت
      return fetch(event.request).catch(() => {
        // إذا فشل الاتصال بالإنترنت ولم يكن الملف في الكاش
        // (يمكنك هنا إرجاع صفحة مخصصة، لكن في حالتك سنرجع الصفحة الرئيسية إذا كان الطلب هو تصفح)
        if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
        }
      });
    })
  );
});

