// Service Worker cơ bản để vượt qua điều kiện PWA của trình duyệt
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Đã cài đặt');
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('[Service Worker] Đã kích hoạt');
});

self.addEventListener('fetch', (e) => {
  // Trả về dữ liệu gốc, không can thiệp cache để tránh lỗi
  e.respondWith(fetch(e.request).catch(() => new Response("Vui lòng kết nối mạng để sử dụng MMENU.")));
});
