// Khởi tạo không gian làm việc chung (Global Object) để các module khác gọi đến
window.App = window.App || {};

// =========================================================================
// KHỐI 1: KHỞI TẠO KẾT NỐI SUPABASE
// =========================================================================
window.SUPABASE_URL = 'https://ftdndkfymswcjedcznrx.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_AysJrUeptA0xLEQGDrkRlg_CH-Lmf2i';
if (typeof supabase !== 'undefined') {
  window.supabase = window.supabase || supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}

// =========================================================================
// KHỐI 2: CÁC HÀM TIỆN ÍCH DOM AN TOÀN (BẢO TOÀN TỪ CODE GỐC)
// =========================================================================
window.safeSet = function(id, val, type = 'text') {
  const el = document.getElementById(id);
  if (!el) return;
  if (type === 'text') el.innerText = val;
  else if (type === 'html') el.innerHTML = val;
  else if (type === 'val') el.value = val;
};

window.safeStyle = function(id, prop, val) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style[prop] = val;
};

// =========================================================================
// KHỐI 3: GIAO DIỆN (UI) CỐT LÕI
// =========================================================================
Object.assign(window.App, {
  showL: function() { safeStyle('globalLoading', 'display', 'flex'); },
  hideL: function() { safeStyle('globalLoading', 'display', 'none'); },
  
  showPopup: function(msg, isSuccess = true) {
    safeSet('popupMessage', msg);
    safeSet('popupTitle', isSuccess ? 'THÀNH CÔNG' : 'THÔNG BÁO');
    const icon = document.getElementById('popupIcon');
    if (icon) {
        icon.innerHTML = isSuccess ? '<i class="fa-solid fa-circle-check" style="color: var(--success);"></i>' : '<i class="fa-solid fa-circle-exclamation" style="color: var(--danger);"></i>';
    }
    safeStyle('customPopup', 'display', 'flex');
  },
  
  closePopup: function() { safeStyle('customPopup', 'display', 'none'); },
  
  openSidebar: function() { safeStyle('globalSidebar', 'display', 'flex'); },
  
  closeSidebar: function(e) { 
    // Ngăn chặn đóng nếu click dính vào khu vực menu bên trong
    if(e && e.target !== document.getElementById('globalSidebar')) return;
    safeStyle('globalSidebar', 'display', 'none'); 
  },
  
  closeTaskDetail: function(e) {
    if(e && e.target !== document.getElementById('taskDetailPopup')) return;
    safeStyle('taskDetailPopup', 'display', 'none');
  },

  nav: function(pageId) {
    this.closeSidebar();
    
    // Tắt tất cả trang đang mở
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Mở trang được gọi
    const target = document.getElementById(pageId);
    if (target) target.classList.add('active');
    
    // Tự động cuộn mượt lên đầu trang
    window.scrollTo(0, 0);
  }
});

// =========================================================================
// KHỐI 4: PWA - CÀI ĐẶT APP RA MÀN HÌNH CHÍNH
// =========================================================================
let deferredPrompt;

// 1. Đăng ký Service Worker khi load trang
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('✅ Service Worker đăng ký thành công!'))
      .catch(err => console.log('❌ Lỗi đăng ký SW:', err));
  });
}

// 2. Bắt sự kiện trình duyệt sẵn sàng cho cài đặt
window.addEventListener('beforeinstallprompt', (e) => {
  // Ngăn trình duyệt tự động hiện popup bừa bãi
  e.preventDefault();
  // Lưu lại sự kiện để kích hoạt khi user bấm nút
  deferredPrompt = e;
  
  // Hiển thị nút Cài đặt trong menu
  const installBtn = document.getElementById('btnInstallApp');
  if(installBtn) installBtn.style.display = 'block';
});

// 3. Hàm kích hoạt khi người dùng bấm nút "Cài đặt App"
Object.assign(window.App, {
  installPWA: async function() {
    if (deferredPrompt) {
      // Hiển thị bảng hỏi cài đặt của hệ thống
      deferredPrompt.prompt();
      
      // Chờ người dùng phản hồi
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User đã đồng ý cài đặt');
      } else {
        console.log('User từ chối cài đặt');
      }
      
      // Reset biến và ẩn nút
      deferredPrompt = null;
      const installBtn = document.getElementById('btnInstallApp');
      if (installBtn) installBtn.style.display = 'none';
      
      this.closeSidebar(); // Đóng menu lại cho gọn
    } else {
      // Hỗ trợ cho iOS (Vì Safari iOS chặn hàm prompt tự động)
      this.showPopup("Để cài đặt trên iPhone/iPad: \n\n1. Bấm nút Chia sẻ (Share) ở dưới cùng trình duyệt.\n2. Chọn 'Thêm vào MH chính' (Add to Home Screen).", false);
    }
  }
});
