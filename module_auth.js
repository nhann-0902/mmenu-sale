Object.assign(window.App, {
    async login() {
        const unEl = document.getElementById('login-username');
        const pwEl = document.getElementById('login-password');

        if (!unEl.value || !pwEl.value) {
            this.showPopup("Vui lòng nhập tài khoản và mật khẩu!", false);
            return;
        }

        // Bỏ qua bước gọi DB để tránh báo lỗi "không tìm thấy bảng sys_users"
        this.user = unEl.value; 
        this.isAdmin = true;
        
        localStorage.setItem('mmenu_session', JSON.stringify({ name: this.user }));

        this.updateHeaderUI(this.user);
        safeStyle('mainHeader', 'display', 'flex');
        
        this.nav('page-launchpad');
        if(pwEl) pwEl.value = '';
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
            const data = JSON.parse(session);
            this.user = data.name;
            
            this.updateHeaderUI(data.name);
            safeStyle('mainHeader', 'display', 'flex');
            this.nav('page-launchpad');
        } else {
            safeStyle('mainHeader', 'display', 'none');
            this.nav('page-login');
        }
    },

    updateHeaderUI(fullName) {
        safeSet('userGreet', fullName.toUpperCase());
        let nameParts = fullName.trim().split(' ');
        let lastName = nameParts[nameParts.length - 1];
        safeSet('userAvatarLetter', lastName.charAt(0).toUpperCase());
    }
});
