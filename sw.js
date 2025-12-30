const CACHE_NAME = 'zakat-app-v7.0-force-offline'; // قمت بتحديث الإصدار

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest_ar.json',
  './manifest_tr.json',
  './notifications.json',
  // المكتبات الخارجية
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf-arabic@1.0.1/dist/jspdf-arabic.min.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Amiri:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Amiri&family=Lateef&family=Cairo&family=Roboto&family=Merriweather&family=Pacifico&display=swap'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('جاري تخزين ملفات التطبيق...');
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
            console.log('حذف الكاش القديم:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // 1. التعامل مع طلبات الصفحة الرئيسية (Navigation)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cachedResponse) => {
        // إذا وجدنا الصفحة الرئيسية في الكاش، نرجعها فوراً
        if (cachedResponse) {
            return cachedResponse;
        }
        // إذا لم نجدها (حالة نادرة)، نحاول جلبها من الشبكة
        return fetch(event.request).catch(() => {
            // إذا فشلت الشبكة أيضاً، نرجع index.html كحل أخير
             return caches.match('./index.html');
        });
      })
    );
    return;
  }

  // 2. التعامل مع باقي الملفات (صور، سكربتات، خطوط)
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((response) => {
      return response || fetch(event.request);
    })
  );
});
