const SUPABASE_URL = 'https://ftdndkfymswcjedcznrx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AysJrUeptA0xLEQGDrkRlg_CH-Lmf2i';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ĐÃ ĐIỀN THÔNG TIN CẤU HÌNH TELEGRAM CỦA BẠN VÀO ĐÂY
const TELEGRAM_BOT_TOKEN = '8749358821:AAHWOKekW6qd12xtjLnMkYUe7k2jJwSR89c'; 
const TELEGRAM_CHAT_ID = '-5308795881'; 

function formatDateStr(dateStr) {
    if(!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'});
}

// Hàm bảo hiểm: Tránh lỗi null khi load HTML chậm
window.safeSet = (id, value, type = 'text') => {
    const el = document.getElementById(id);
    if (el) {
        if (type === 'text') el.innerText = value;
        else if (type === 'html') el.innerHTML = value;
        else if (type === 'value') el.value = value;
    }
};

window.safeStyle = (id, prop, value) => {
    const el = document.getElementById(id);
    if (el) el.style[prop] = value;
};

window.App = {
    user: "Nhân", 
    isAdmin: true, 
    staffList: ["Anh Cường", "Văn Nhân", "Huyền Trang", "Minh Hoàng", "Thanh Dung", "CSKH"],
    sourceList: ["Tự tìm", "Marketing", "Giới thiệu"],
    typeList: ["Phần mềm", "Phần cứng", "Combo", "Gia hạn"],
    chartInstances: {}, 

    sendTelegram(message) {
        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID || TELEGRAM_BOT_TOKEN.includes('ĐIỀN_TOKEN')) return;
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML' })
        }).catch(err => console.error('Lỗi gửi Telegram:', err));
    },
    
    showL() { const el = document.getElementById('globalLoading'); if(el) el.classList.add('active'); },
    hideL() { const el = document.getElementById('globalLoading'); if(el) el.classList.remove('active'); },
    
    showPopup(msg, isSuccess = false) {
      const msgEl = document.getElementById('popupMessage');
      if(!msgEl) return;
      msgEl.innerText = msg;
      
      const iconEl = document.getElementById('popupIcon');
      if(iconEl) {
          iconEl.innerHTML = isSuccess ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-code"></i>';
          iconEl.style.color = isSuccess ? 'var(--success)' : 'var(--info)';
      }
      
      safeSet('popupTitle', isSuccess ? 'THÀNH CÔNG' : 'THÔNG BÁO');
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
      }
      
      if(id === 'page-login') document.body.classList.add('is-login');
      else document.body.classList.remove('is-login');
      
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
        safeSet('assignFormContainer', '', 'html');
        this.addAssignBlock(2);
      }
      if (id === 'page-schedule' && typeof this.loadSchedule === 'function') this.loadSchedule();
    },

    fmt(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; },
    fmtFull(n) { return (n || 0).toLocaleString('vi-VN') + 'đ'; },
    
    initData() { 
      const today = new Date().toISOString().split('T')[0];
      document.querySelectorAll('.default-today').forEach(el => { if(!el.value) el.value = today; }); 
      
      safeSet('r_src', `<option value="">Chọn nguồn...</option>` + this.sourceList.map(x => `<option value="${x}">${x}</option>`).join(''), 'html');
      safeSet('r_type', `<option value="">Chọn loại...</option>` + this.typeList.map(x => `<option value="${x}">${x}</option>`).join(''), 'html');

      if (typeof this.checkSession === 'function') this.checkSession();
    }
};

window.onload = function() { window.App.initData(); };
