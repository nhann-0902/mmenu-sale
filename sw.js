const CACHE_NAME = 'mmenu-pwa-v1';

// Các file cốt lõi cần nạp vào bộ nhớ tạm để vượt qua bài kiểm tra PWA của trình duyệt
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './core.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  console.log('[Service Worker] Đang cài đặt PWA...');
  self.skipWaiting(); // Ép Service worker mới kích hoạt ngay
  
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Đã lưu cache hệ thống');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', (e) => {
  console.log('[Service Worker] Đã kích hoạt');
  // Dọn dẹp cache cũ nếu có cập nhật phiên bản
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// CHIẾN LƯỢC NETWORK-FIRST (Ưu tiên mạng)
self.addEventListener('fetch', (e) => {
  // Bỏ qua các request lấy dữ liệu API từ Supabase, Google, Telegram (không cache dữ liệu động)
  if (e.request.url.includes('supabase.co') || 
      e.request.url.includes('script.google.com') || 
      e.request.url.includes('api.telegram.org')) {
      return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Nếu có mạng: Trả về code mới nhất và tự động lưu đè bản cập nhật vào Cache
        if(response && response.status === 200 && response.type === 'basic') {
          let responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Nếu mất mạng: Lấy file giao diện đã lưu trong Cache ra để dùng tạm
        return caches.match(e.request).then((response) => {
          if (response) {
            return response;
          }
          // Nếu mất mạng và file cũng không có trong cache
          return new Response("Bạn đang offline. Hệ thống MMENU cần kết nối mạng để sử dụng.", {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
  );
});
