window.App = window.App || {};

// =========================================================================
// KHỐI 1: KHỞI TẠO KẾT NỐI SUPABASE TRỰC TIẾP
// =========================================================================
window.SUPABASE_URL = 'https://ftdndkfymswcjedcznrx.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_AysJrUeptA0xLEQGDrkRlg_CH-Lmf2i';

window.supabase = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
window.supabaseClient = window.supabase; 

// =========================================================================
// KHỐI 2: CÁC HÀM TIỆN ÍCH DOM & FORMATTER
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

window.formatDateStr = function(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'});
};

// =========================================================================
// KHỐI 3: GIAO DIỆN (UI) CỐT LÕI - TỐI ƯU HÓA HIỆU ỨNG (KHÔNG RÚT GỌN)
// =========================================================================
Object.assign(window.App, {
  showL: function() { 
      const el = document.getElementById('globalLoading');
      if (el) el.style.setProperty('display', 'flex', 'important');
  },
  hideL: function() { 
      const el = document.getElementById('globalLoading');
      if (el) el.style.setProperty('display', 'none', 'important');
  },
  
  showPopup: function(msg, isSuccess = true) {
    safeSet('popupMessage', msg);
    safeSet('popupTitle', isSuccess ? 'THÀNH CÔNG' : 'THÔNG BÁO');
    const icon = document.getElementById('popupIcon');
    if (icon) {
        icon.innerHTML = isSuccess ? '<i class="fa-solid fa-circle-check" style="color: var(--success);"></i>' : '<i class="fa-solid fa-circle-exclamation" style="color: var(--danger);"></i>';
    }
    const popup = document.getElementById('customPopup');
    if (popup) {
        popup.style.setProperty('display', 'flex', 'important');
        setTimeout(() => popup.classList.add('active'), 10);
    }
  },
  
  closePopup: function() { 
    const popup = document.getElementById('customPopup');
    if (popup) {
        popup.classList.remove('active');
        setTimeout(() => popup.style.setProperty('display', 'none', 'important'), 300);
    }
  },
  
  openSidebar: function() { 
    const sidebar = document.getElementById('globalSidebar');
    if (sidebar) {
        sidebar.style.setProperty('display', 'block', 'important');
        setTimeout(() => sidebar.classList.add('active'), 10);
    }
  },
  
  closeSidebar: function(e) { 
    const sidebar = document.getElementById('globalSidebar');
    if (e && e.target !== sidebar) return;
    if (sidebar) {
        sidebar.classList.remove('active');
        setTimeout(() => sidebar.style.setProperty('display', 'none', 'important'), 300);
    }
  },
  
  closeTaskDetail: function(e) {
    const popup = document.getElementById('taskDetailPopup');
    if (e && e.target !== popup) return;
    if (popup) {
        popup.classList.remove('active');
        setTimeout(() => popup.style.setProperty('display', 'none', 'important'), 300);
    }
  },

  fmt: function(num) {
      if (!num) return '0đ';
      if (num >= 1000000000) return (num / 1000000000).toFixed(1) + ' Tỷ';
      if (num >= 1000000) return (num / 1000000).toFixed(1) + ' Tr';
      return num.toLocaleString('vi-VN') + 'đ';
  },

  fmtFull: function(num) {
      if (!num) return '0đ';
      return num.toLocaleString('vi-VN') + 'đ';
  },

  nav: function(pageId) {
    this.closeSidebar();
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pageId === 'page-dashboard' && typeof this.loadDashboards === 'function') this.loadDashboards();
    if (pageId === 'page-daily' && typeof this.loadDailyTasks === 'function') this.loadDailyTasks();
    if (pageId === 'page-task-list' && typeof this.loadAllTasks === 'function') this.loadAllTasks();
    if (pageId === 'page-schedule' && typeof this.loadSchedule === 'function') this.loadSchedule();
  }
});

// =========================================================================
// KHỐI 4: PWA - CÀI ĐẶT APP
// =========================================================================
let deferredPrompt;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW Error:', err));
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('btnInstallApp');
  if(installBtn) installBtn.style.display = 'block';
});

Object.assign(window.App, {
  installPWA: async function() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      document.getElementById('btnInstallApp').style.display = 'none';
      this.closeSidebar();
    } else {
      this.showPopup("Để cài đặt trên iPhone/iPad: \n\n1. Bấm nút Chia sẻ (Share) ở dưới cùng trình duyệt.\n2. Chọn 'Thêm vào MH chính' (Add to Home Screen).", false);
    }
  }
});
