Object.assign(window.App, {
  login: async function() {
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value.trim();

    if (!user || !pass) {
      this.showPopup("Vui lòng nhập đầy đủ Tài khoản và Mật khẩu!", false);
      return;
    }

    this.showL(); 

    try {
      const { data, error } = await window.supabase
        .from('sys_users')
        .select('*')
        .eq('username', user)
        .eq('password', pass)
        .single(); 

      if (error || !data) {
        console.error("LỖI SUPABASE TRẢ VỀ:", error); 
        this.showPopup("Sai tài khoản hoặc mật khẩu! Vui lòng kiểm tra lại.", false);
      } else {
        localStorage.setItem('mmenu_user', JSON.stringify(data));
        this.setupUserUI(data);
        
        document.getElementById('mainHeader').style.display = 'flex';
        this.nav('page-launchpad'); 
      }
    } catch (err) {
      console.error("LỖI KẾT NỐI:", err);
      this.showPopup("Lỗi hệ thống: " + err.message, false);
    } finally {
      this.hideL(); 
    }
  },

  logout: function() {
    localStorage.removeItem('mmenu_user');
    window.CURRENT_USER = null;
    
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    
    document.getElementById('mainHeader').style.display = 'none';
    this.nav('page-login');
  },

  checkAuth: function() {
    const savedUser = localStorage.getItem('mmenu_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      this.setupUserUI(userData);
      document.getElementById('mainHeader').style.display = 'flex';
      this.nav('page-launchpad');
    } else {
      document.getElementById('mainHeader').style.display = 'none';
      this.nav('page-login');
    }
  },

  setupUserUI: function(userData) {
    const displayName = userData.full_name || userData.username || "Nhân sự";
    safeSet('userGreet', displayName);
    safeSet('userAvatarLetter', displayName.charAt(0).toUpperCase());
    window.CURRENT_USER = userData;
    this.user = displayName; 
  }
});

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.App && window.App.checkAuth) {
      window.App.checkAuth();
    }
  }, 100);
});
