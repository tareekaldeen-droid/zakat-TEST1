const CACHE_NAME = 'zakat-app-v55.9'; // قم بتغيير الرقم عند كل تحديث للكود
const NOTIFICATIONS_FILE = 'notifications.json';

// الملفات التي سيتم تخزينها للعمل بدون إنترنت
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest_ar.json',
  './manifest_tr.json',
  // المكتبات الخارجية المستخدمة في الكود (مهم جداً تخزينها)
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://fonts.googleapis.com/css2?family=Amiri&family=Lateef&family=Cairo&family=Roboto&family=Merriweather&family=Pacifico&display=swap',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Amiri:wght@400;700&display=swap',
  'https://cdn.jsdelivr.net/npm/jspdf-arabic@1.0.1/dist/jspdf-arabic.min.js',
  // اللوجوهات
  'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,h=711,fit=crop/a5oqci6YCwpNHTpH/gemini_generated_image_l7bj58l7bj58l7bj-1-1-okXWwLISbvVl1n90.png',
  'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,h=711,fit=crop/a5oqci6YCwpNHTpH/__gemini_generated_image_l7bj58l7bj58l7bj---uo3o-r-o-c-1-Egn1jwHegFrVqeor.png'
];

// 1. التثبيت: تخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  self.skipWaiting(); // تفعيل التحديث فوراً
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // نحاول تخزين الملفات، حتى لو فشل بعضها (مثل الخطوط) يستمر التطبيق
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.log('Some assets failed to cache', err));
    })
  );
});

// 2. التفعيل: تنظيف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. جلب البيانات: استراتيجية ذكية
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // استثناء: ملف الإشعارات (نحاول جلبه من النت أولاً للحصول على الأخبار الجديدة)
  if (url.pathname.endsWith(NOTIFICATIONS_FILE)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // إذا نجح النت، نحدث الكاش ونرجع الاستجابة
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
          return response;
        })
        .catch(() => {
          // إذا فشل النت، نرجع النسخة القديمة من الكاش (أو فارغ)
          return caches.match(event.request).then(res => res || new Response('{"latest": null}', { headers: { 'Content-Type': 'application/json' } }));
        })
    );
    return;
  }

  // باقي الملفات: استراتيجية Stale-While-Revalidate
  // (اعرض النسخة المخزنة فوراً للسرعة، وحدثها في الخلفية للمرة القادمة)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // تحديث الكاش بالنسخة الجديدة
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
           const responseToCache = networkResponse.clone();
           caches.open(CACHE_NAME).then((cache) => {
             cache.put(event.request, responseToCache);
           });
        }
        return networkResponse;
      }).catch(() => {
        // لا نفعل شيئاً عند فشل النت، لأننا عرضنا النسخة المخزنة بالفعل
      });

      // إرجاع النسخة المخزنة إن وجدت، وإلا انتظار النت
      return cachedResponse || fetchPromise;
    })
  );
});

























































