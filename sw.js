

// قمنا بتغيير الإصدار إلى v5.0 لإجبار المتصفح على إعادة التخزين
const CACHE_NAME = 'zakat-app-v5.9'; 

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest_ar.json',
  './manifest_tr.json', // ضروري جداً وجود هذا الملف هنا
  './notifications.json',
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf-arabic@1.0.1/dist/jspdf-arabic.min.js'

];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('جاري تخزين ملفات التطبيق (عربي وتركي)...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// تفعيل وتنظيف القديم
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
  return self.clients.claim();
});

// استراتيجية جلب البيانات (Network First, then Cache)
self.addEventListener('fetch', (event) => {
  // استثناء طلبات الويب الخارجية إذا أردت، أو تركها كما هي
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // إذا نجح الاتصال، نحدث الكاش
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
        // إذا فشل النت، نلجأ للكاش
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // إذا طلب المستخدم الصفحة الرئيسية أو أي صفحة فرعية، نعيد له index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});













