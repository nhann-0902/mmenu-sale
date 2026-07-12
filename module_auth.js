Object.assign(window.App, {
  // 1. HÀM XỬ LÝ ĐĂNG NHẬP
  login: async function() {
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value.trim();

    if (!user || !pass) {
      this.showPopup("Vui lòng nhập đầy đủ Tài khoản và Mật khẩu!", false);
      return;
    }

    this.showL(); // Hiện màn hình loading

    try {
      // Gọi Supabase kiểm tra tài khoản (LƯU Ý: Đảm bảo tên bảng là mmenu_staff)
      const { data, error } = await window.supabase
        .from('mmenu_staff')
        .select('*')
        .eq('username', user)
        .eq('password', pass)
        .single(); // single() đảm bảo chỉ lấy 1 dòng dữ liệu duy nhất

      if (error || !data) {
        console.error("Lỗi Supabase:", error); // In lỗi ra F12 để dễ debug
        this.showPopup("Sai tài khoản hoặc mật khẩu! Vui lòng kiểm tra lại.", false);
      } else {
        // Đăng nhập thành công -> Lưu vào bộ nhớ trình duyệt
        localStorage.setItem('mmenu_user', JSON.stringify(data));
        this.setupUserUI(data);
        
        // Hiện thanh Header và chuyển sang Trang chủ (Launchpad)
        document.getElementById('mainHeader').style.display = 'flex';
        this.nav('page-launchpad'); 
      }
    } catch (err) {
      this.showPopup("Lỗi kết nối máy chủ: " + err.message, false);
    } finally {
      this.hideL(); // Tắt loading
    }
  },

  // 2. HÀM ĐĂNG XUẤT
  logout: function() {
    localStorage.removeItem('mmenu_user');
    window.CURRENT_USER = null;
    
    // Xóa trắng ô nhập liệu
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    
    // Ẩn Header và quay về trang Login
    document.getElementById('mainHeader').style.display = 'none';
    this.nav('page-login');
  },

  // 3. HÀM KIỂM TRA TRẠNG THÁI (ĐỂ KHÔNG PHẢI ĐĂNG NHẬP LẠI KHI F5)
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

  // 4. HÀM THIẾT LẬP GIAO DIỆN USER (Tên, Avatar...)
  setupUserUI: function(userData) {
    // Ưu tiên hiển thị fullname, nếu không có thì hiện username
    const displayName = userData.fullname || userData.username || "Nhân sự";
    
    safeSet('userGreet', displayName);
    safeSet('userAvatarLetter', displayName.charAt(0).toUpperCase());
    
    // Lưu thông tin vào biến Toàn cục (Global) để các module khác (Task, Doanh thu) gọi tên
    window.CURRENT_USER = userData;
  }
});

// =========================================================================
// TỰ ĐỘNG CHẠY KIỂM TRA ĐĂNG NHẬP KHI VỪA MỞ WEB
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
  // Chờ 1 chút để đảm bảo file core.js đã nạp xong window.App
  setTimeout(() => {
    if (window.App && window.App.checkAuth) {
      window.App.checkAuth();
    }
  }, 100);
});
