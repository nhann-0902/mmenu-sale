const SUPABASE_URL = 'https://ftdndkfymswcjedcznrx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AysJrUeptA0xLEQGDrkRlg_CH-Lmf2i';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function formatDateStr(dateStr) {
    if(!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'});
}

window.App = {
    user: "Nhân", 
    staffList: ["Anh Cường", "Văn Nhân", "Huyền Trang", "Minh Hoàng", "Thanh Dung", "CSKH"],
    sourceList: ["Tự tìm", "Marketing", "Giới thiệu"],
    typeList: ["Phần mềm", "Phần cứng", "Combo", "Gia hạn"],
    chartInstances: {}, 
    
    showL() { const el = document.getElementById('globalLoading'); if(el) el.classList.add('active'); },
    hideL() { const el = document.getElementById('globalLoading'); if(el) el.classList.remove('active'); },
    
    showPopup(msg, isSuccess = false) {
      const msgEl = document.getElementById('popupMessage');
      if(!msgEl) return;
      msgEl.innerText = msg;
      const popEl = document.getElementById('customPopup');
      if(popEl) popEl.classList.add('active');
    },
    closePopup() { const el = document.getElementById('customPopup'); if(el) el.classList.remove('active'); },

    openSidebar() { const el = document.getElementById('globalSidebar'); if(el) el.classList.add('active'); },
    closeSidebar(e) { 
      if (e === true || (e.target && e.target.id === 'globalSidebar')) {
        const el = document.getElementById('globalSidebar');
        if(el) el.classList.remove('active');
      }
    },

    nav(id) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      let target = document.getElementById(id);
      if(target) { 
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
        if(id === 'page-login') document.body.classList.add('is-login');
        else document.body.classList.remove('is-login');
      }
      if(window.innerWidth < 1024) this.closeSidebar(true);
      document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
      let activeMenu = document.querySelector(`.menu-item[onclick*="${id}"]`);
      if(activeMenu) activeMenu.classList.add('active');
      
      if (typeof this.loadDashboards === 'function' && id === 'page-dashboard') this.loadDashboards();
      if (typeof this.loadDailyTasks === 'function' && id === 'page-daily') this.loadDailyTasks();
      if (typeof this.loadAllTasks === 'function' && id === 'page-task-list') this.loadAllTasks();
      if (typeof this.addAssignBlock === 'function' && id === 'page-task-assign') { 
        const container = document.getElementById('assignFormContainer');
        if(container) container.innerHTML = ''; 
        this.addAssignBlock(2);
      }
    },

    fmt(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; },
    fmtFull(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; },
    
    initData() { 
      const today = new Date().toISOString().split('T')[0];
      document.querySelectorAll('.default-today').forEach(el => { if(!el.value) el.value = today; }); 
      if (typeof this.checkSession === 'function') this.checkSession();
    }
};
window.onload = function() { window.App.initData(); };
