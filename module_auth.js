Object.assign(window.App, {
    async login() {
        const unEl = document.getElementById('login-username');
        const pwEl = document.getElementById('login-password');
        const un = unEl ? unEl.value.trim() : "";
        const pw = pwEl ? pwEl.value.trim() : "";

        if(!un || !pw) {
            this.showPopup("Vui lòng nhập đủ tài khoản và mật khẩu!", false);
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
            const { data, error } = await supabaseClient
                .from('sys_users') 
                .select('*')
                .eq('username', un)
                .eq('password', pw)
                .single(); 

            if (error || !data) {
                throw new Error("zalo: 0358292392, Nhân để được hỗ trợ");
            }

            this.user = data.full_name;
            this.isAdmin = (data.role === 'Admin');
            
            localStorage.setItem('mmenu_session', JSON.stringify({ 
                name: data.full_name, 
                username: data.username, 
                role: data.role 
            }));

            this.updateHeaderUI(data.full_name);
            safeStyle('mainHeader', 'display', 'flex');
            
            this.nav('page-launchpad');
            if(pwEl) pwEl.value = '';

        } catch (err) {
            this.showPopup("zalo: 0358292392, Nhân để được hỗ trợ", false);
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
            this.isAdmin = (data.role === 'Admin');
            
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
