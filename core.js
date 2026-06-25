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
    isAdmin: true, 
    staffList: ["Sofia", "Jack", "Peter", "Nhân", "Linh"],
    sourceList: ["Tự tìm", "Marketing", "Giới thiệu"],
    typeList: ["Phần mềm", "Phần cứng", "Combo", "Gia hạn"],
    
    showL() { 
        const el = document.getElementById('globalLoading');
        if(el) el.classList.add('active'); 
    },
    hideL() { 
        const el = document.getElementById('globalLoading');
        if(el) el.classList.remove('active'); 
    },
    
    showPopup(msg, isSuccess = false) {
      if(!document.getElementById('popupMessage')) return;
      document.getElementById('popupMessage').innerText = msg;
      document.getElementById('popupIcon').innerHTML = isSuccess ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-code"></i>';
      document.getElementById('popupIcon').style.color = isSuccess ? 'var(--success)' : 'var(--info)';
      document.getElementById('popupTitle').innerText = isSuccess ? 'THÀNH CÔNG' : 'THÔNG BÁO';
      document.getElementById('customPopup').classList.add('active');
    },
    closePopup() { 
        const el = document.getElementById('customPopup');
        if(el) el.classList.remove('active'); 
    },

    openSidebar() { 
        const el = document.getElementById('globalSidebar');
        if(el) el.classList.add('active'); 
    },
    closeSidebar(e) { 
      if (e === true || e.target.id === 'globalSidebar') {
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
      }
      
      if(window.innerWidth < 1024) this.closeSidebar(true);
      document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
      let activeMenu = document.querySelector(`.menu-item[onclick*="${id}"]`);
      if(activeMenu) activeMenu.classList.add('active');

      if (id === 'page-dashboard' && typeof this.loadDashboards === 'function') this.loadDashboards();
      if (id === 'page-daily' && typeof this.loadDailyTasks === 'function') this.loadDailyTasks();
      if (id === 'page-daily-confirm' && typeof this.renderDailyConfirm === 'function') this.renderDailyConfirm();
      if (id === 'page-revenue-confirm' && typeof this.renderRevConfirm === 'function') this.renderRevConfirm();
      if (id === 'page-task-list' && typeof this.loadAllTasks === 'function') this.loadAllTasks();
      if (id === 'page-task-assign' && typeof this.addAssignBlock === 'function') { 
        const container = document.getElementById('assignFormContainer');
        if(container) container.innerHTML = ''; 
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
    
    initData() { 
      const today = new Date().toISOString().split('T')[0];
      document.querySelectorAll('.default-today').forEach(el => { if(!el.value) el.value = today; }); 
      
      const elSrc = document.getElementById('r_src');
      if(elSrc) elSrc.innerHTML = `<option value="">Chọn nguồn...</option>` + this.sourceList.map(x => `<option value="${x}">${x}</option>`).join('');
      
      const elType = document.getElementById('r_type');
      if(elType) elType.innerHTML = `<option value="">Chọn loại...</option>` + this.typeList.map(x => `<option value="${x}">${x}</option>`).join('');
    }
};

window.onload = function() { window.App.initData(); };
