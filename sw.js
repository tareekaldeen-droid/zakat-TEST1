

const CACHE_NAME = 'zakat-app-v 6.3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest_ar.json',
  './manifest_tr.json',
  './notifications.json',
 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf-arabic@1.0.1/dist/jspdf-arabic.min.js'

];

// 1. تثبيت Service Worker وتخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  self.skipWaiting(); // تفعيل التحديث فوراً
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
    })
  );
  return self.clients.claim();
});

// 3. استراتيجية الشبكة أولاً، ثم الكاش (Network First, falling back to Cache)
// هذا يضمن حصول المستخدم على أحدث نسخة إذا كان متصلاً، والنسخة المحفوظة إذا لم يكن متصلاً
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // إذا نجح الاتصال بالإنترنت، قم بتحديث النسخة في الكاش
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // إذا فشل الاتصال (لا يوجد إنترنت)، ابحث في الكاش
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // إذا كان الطلب هو الصفحة الرئيسية ولم تكن موجودة (حالة نادرة)
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});














