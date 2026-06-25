// Khởi tạo Supabase Client
const SUPABASE_URL = 'https://ftdndkfymswcjedcznrx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AysJrUeptA0xLEQGDrkRlg_CH-Lmf2i';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Utility Format Date
function formatDateStr(dateStr) {
    if(!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'});
}

// KHỞI TẠO ĐỐI TƯỢNG APP TOÀN CỤC
window.App = {
    user: "Nhân", 
    isAdmin: true, 
    staffList: ["Sofia", "Jack", "Peter", "Nhân", "Linh"],
    sourceList: ["Tự tìm", "Marketing", "Giới thiệu"],
    typeList: ["Phần mềm", "Phần cứng", "Combo", "Gia hạn"],
    
    // UI Loading & Popups
    showL() { document.getElementById('globalLoading').classList.add('active'); },
    hideL() { document.getElementById('globalLoading').classList.remove('active'); },
    
    showPopup(msg, isSuccess = false) {
      document.getElementById('popupMessage').innerText = msg;
      document.getElementById('popupIcon').innerHTML = isSuccess ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-code"></i>';
      document.getElementById('popupIcon').style.color = isSuccess ? 'var(--success)' : 'var(--info)';
      document.getElementById('popupTitle').innerText = isSuccess ? 'THÀNH CÔNG' : 'THÔNG BÁO';
      document.getElementById('customPopup').classList.add('active');
    },
    closePopup() { document.getElementById('customPopup').classList.remove('active'); },

    // Sidebar Logic
    openSidebar() { document.getElementById('globalSidebar').classList.add('active'); },
    closeSidebar(e) { 
      if (e === true || e.target.id === 'globalSidebar') {
        document.getElementById('globalSidebar').classList.remove('active');
      }
    },

    // Navigation & Routing
    nav(id) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      let target = document.getElementById(id);
      if(target) { 
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
      }
      
      if(window.innerWidth < 1024) this.closeSidebar(true);
      document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
      let activeMenu = document.querySelector(`.menu-item[onclick*="${id}"]`);
      if(activeMenu) activeMenu.classList.add('active');

      // Kích hoạt hàm tương ứng khi mở module
      if (id === 'page-dashboard' && typeof this.loadDashboards === 'function') this.loadDashboards();
      if (id === 'page-daily' && typeof this.loadDailyTasks === 'function') this.loadDailyTasks();
      if (id === 'page-daily-confirm' && typeof this.renderDailyConfirm === 'function') this.renderDailyConfirm();
      if (id === 'page-revenue-confirm' && typeof this.renderRevConfirm === 'function') this.renderRevConfirm();
      if (id === 'page-task-list' && typeof this.loadAllTasks === 'function') this.loadAllTasks();
      if (id === 'page-task-assign' && typeof this.addAssignBlock === 'function') { 
        document.getElementById('assignFormContainer').innerHTML = ''; 
        this.addAssignBlock(2);
      }
    },

    fmt(n) { 
        if(n === 0) return '0đ';
        if(n >= 1e6) return (n/1e6).toFixed(1) + 'M'; 
        return n.toLocaleString('vi-VN') + 'đ';
    },
    fmtFull(n) { 
        if(!n) return '0đ'; 
        return Number(n).toLocaleString('vi-VN') + 'đ';
    },
    
    // Gán dữ liệu mặc định ban đầu
    initData() { 
      const today = new Date().toISOString().split('T')[0];
      document.querySelectorAll('.default-today').forEach(el => { if(!el.value) el.value = today; }); 
      document.getElementById('r_src').innerHTML = `<option value="">Chọn nguồn...</option>` + this.sourceList.map(x => `<option value="${x}">${x}</option>`).join('');
      document.getElementById('r_type').innerHTML = `<option value="">Chọn loại...</option>` + this.typeList.map(x => `<option value="${x}">${x}</option>`).join('');
    }
};

window.onload = function() { window.App.initData(); };
