const CACHE_NAME = 'masternet-accounting-v2';
const ASSETS = [
    './',
    './index.html',
    './style.css?v=2.2',
    './app.js?v=2.2',
    './manifest.json',
    './logo.png'
];

// تثبيت السيرفس وركر وتخزين الموارد الأساسية
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching essential assets...');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// تفعيل السيرفس وركر وتنظيف الكاش القديم
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log('Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// اعتراض الطلبات وتوفير الموارد من الكاش عند انقطاع الإنترنت
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(e.request).then(response => {
                    // التحقق من صحة الاستجابة قبل التخزين التلقائي للموارد الجديدة
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        // لا تقم بتخزين الطلبات الخارجية أو روابط الـ CDN في الكاش إلا إذا كانت آمنة ومحددة
                        if (e.request.url.startsWith(self.location.origin)) {
                            cache.put(e.request, responseToCache);
                        }
                    });
                    
                    return response;
                }).catch(() => {
                    // في حال انقطاع الشبكة وطلب موارد غير مخزنة
                    console.log('Network request failed, offline mode.');
                });
            })
    );
});
