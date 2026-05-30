const CACHE_NAME = 'sgr-registry-v1';
const ASSETS_TO_CACHE = [
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('PWA Service Worker: Caching offline shell assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('PWA Service Worker: Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First Strategy (เพื่อให้มั่นใจว่าโค้ดได้รับการอัปเดตทันที)
self.addEventListener('fetch', event => {
  // ข้าม Request ที่ไม่ใช่ GET หรือระบบภายนอกอื่นๆ
  if (event.request.method !== 'GET' || event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // หากดึงข้อมูลผ่านเครือข่ายสำเร็จ ให้นำไปเก็บในแคช
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // หากไม่มีการเชื่อมต่อเครือข่าย ให้พึ่งพาไฟล์แคชเดิม
        return caches.match(event.request);
      })
  );
});
