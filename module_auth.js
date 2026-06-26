Object.assign(window.App, {
    async login() {
        const unEl = document.getElementById('login-username');
        const pwEl = document.getElementById('login-password');

        if (!unEl || !unEl.value.trim()) {
            this.showPopup("Vui lòng nhập tên tài khoản (gì cũng được) để vào!", false);
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
            // TẠM THỜI BỎ QUA CHECK DATABASE ĐỂ VÀO THẲNG TEST HỆ THỐNG
            this.user = unEl.value.trim(); 
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
            this.showPopup("Lỗi hệ thống: " + err.message, false);
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
