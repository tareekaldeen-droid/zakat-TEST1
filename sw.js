const CACHE_NAME = 'app-v23-network-first'; // ⚠️ قم بتغيير هذا الرقم عند كل تحديث
const ASSETS = [
    './',
    './index.html',
    './manifest_ar.json', // ضروري للغة العربية
    './manifest_tr.json', // ضروري للغة التركية
    './notifications.json',
    // المكتبات الخارجية لضمان عمل الحاسبة والـ PDF بدون إنترنت
    'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdn.jsdelivr.net/npm/jspdf-arabic@1.0.1/dist/jspdf-arabic.min.js'
];

// 1. التثبيت (Install)
self.addEventListener('install', event => {
    self.skipWaiting(); // يجبر الـ SW الجديد على العمل فوراً
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Caching app assets...');
            return cache.addAll(ASSETS);
        })
    );
});

// 2. التفعيل (Activate) - تنظيف الكاش القديم
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) {
                    console.log('Deleting old cache:', key);
                    return caches.delete(key);
                }
            })
        )).then(() => {
            return self.clients.claim(); // السيطرة على الصفحات المفتوحة فوراً
        })
    );
});

// 3. جلب البيانات (Fetch) - الاستراتيجية الذكية
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // استراتيجية (Network First): للملفات التي تتغير باستمرار أو تحتاج تحديث فوري
    // تشمل: الصفحة الرئيسية، ملف الإشعارات، وملفات المانيفست (لتغيير الاسم واللغة)
    if (url.pathname.endsWith('notifications.json') || 
        url.pathname.endsWith('index.html') || 
        url.pathname.endsWith('/') ||
        url.pathname.includes('manifest') || // يشمل manifest_ar.json و manifest_tr.json
        event.request.mode === 'navigate') {
        
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // إذا نجح الاتصال، نحدث الكاش بالنسخة الجديدة
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // إذا فشل النت، نستخدم النسخة المخبأة
                    return caches.match(event.request);
                })
        );
        return;
    }

    // استراتيجية (Cache First): للملفات الثابتة (مكتبات JS، صور، خطوط)
    // نستخدم الكاش أولاً للسرعة، وإذا لم نجد الملف نطلبه من النت
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(networkResponse => {
                // تخزين الملف الجديد في الكاش للمستقبل
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});
