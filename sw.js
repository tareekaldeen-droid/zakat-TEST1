const CACHE_NAME = 'zakat-app-v3.0';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest_ar.json',
    './manifest_tr.json',
    './notifications.json',
    // المكتبات الخارجية المستخدمة في التطبيق (لضمان عملها بدون نت)
    'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdn.jsdelivr.net/npm/jspdf-arabic@1.0.1/dist/jspdf-arabic.min.js',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Amiri:wght@400;700&display=swap'
];

// تثبيت Service Worker وتخزين الملفات
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// تفعيل Service Worker وحذف الكاش القديم
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// استراتيجية الجلب: الكاش أولاً، ثم الشبكة (Cache First, falling back to Network)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // إذا وجد الملف في الكاش، قم بإرجاعه
            if (response) {
                return response;
            }
            // إذا لم يوجد، اطلبه من الإنترنت
            return fetch(event.request).catch(() => {
                // إذا فشل الطلب (لا يوجد نت)، يمكن إرجاع صفحة بديلة هنا إذا أردت
                // حالياً نكتفي بما تم تخزينه
            });
        })
    );
});
