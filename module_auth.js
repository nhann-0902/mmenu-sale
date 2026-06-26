Object.assign(window.App, {
    async login() {
        const unEl = document.getElementById('login-username');
        const pwEl = document.getElementById('login-password');
        const un = unEl ? unEl.value.trim() : "";
        
        if (!un) {
            this.showPopup("Vui lòng nhập Tên tài khoản để đăng nhập!", false);
            return;
        }

        const btn = document.getElementById('btn-login');
        let orgText = "ĐĂNG NHẬP";
        if (btn) {
            orgText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG XỬ LÝ...';
            btn.disabled = true;
        }

        try {
            // BYPASS: Đăng nhập test thẳng vào hệ thống
            this.user = un; 
            this.isAdmin = true;
            
            localStorage.setItem('mmenu_session', JSON.stringify({ 
                name: this.user,
                role: 'Admin'
            }));

            this.updateHeaderUI(this.user);
            safeStyle('mainHeader', 'display', 'flex');
            
            this.nav('page-launchpad');
            if(pwEl) pwEl.value = '';

        } catch (err) {
            this.showPopup("Lỗi đăng nhập: " + err.message, false);
        } finally {
            if (btn) {
                btn.innerHTML = orgText;
                btn.disabled = false;
            }
        }
    },

    logout() {
        if(!confirm("Bạn có chắc chắn muốn đăng xuất?")) return;
        localStorage.removeItem('mmenu_session');
        this.user = "";
        
        safeStyle('mainHeader', 'display', 'none');
        this.nav('page-login');
        this.closeSidebar(true);
    },

    checkSession() {
        const session = localStorage.getItem('mmenu_session');
        if (session) {
            try {
                // Đọc JSON, nếu bị lỗi cấu trúc cũ, sẽ nhảy thẳng xuống catch
                const data = JSON.parse(session);
                this.user = data.name || "Nhân";
                
                this.updateHeaderUI(this.user);
                safeStyle('mainHeader', 'display', 'flex');
                this.nav('page-launchpad');
            } catch(e) {
                // TỰ ĐỘNG DỌN RÁC NẾU LỖI KẸT CACHE CŨ
                console.warn("Xóa phiên làm việc cũ bị lỗi...");
                localStorage.removeItem('mmenu_session');
                safeStyle('mainHeader', 'display', 'none');
                this.nav('page-login');
            }
        } else {
            safeStyle('mainHeader', 'display', 'none');
            this.nav('page-login');
        }
    },

    updateHeaderUI(fullName) {
        if (!fullName) fullName = "Admin";
        safeSet('userGreet', fullName.toUpperCase());
        let nameParts = fullName.trim().split(' ');
        let lastName = nameParts[nameParts.length - 1];
        if (lastName) safeSet('userAvatarLetter', lastName.charAt(0).toUpperCase());
    }
});
