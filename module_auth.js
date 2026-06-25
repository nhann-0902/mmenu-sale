Object.assign(window.App, {
    async login() {
        const un = document.getElementById('login-username').value.trim();
        const pw = document.getElementById('login-password').value.trim();

        if(!un || !pw) {
            this.showPopup("Vui lòng nhập đủ tài khoản và mật khẩu!", false);
            return;
        }

        const btn = document.getElementById('btn-login');
        const orgText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG XỬ LÝ...';
        btn.disabled = true;

        try {
            const { data, error } = await supabaseClient
                .from('SYS_USERS')
                .select('*')
                .eq('username', un)
                .eq('password', pw)
                .single(); 

            if (error || !data) {
                // Ép bung lỗi tùy chỉnh của bạn nếu Supabase không tìm thấy user
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
            document.getElementById('mainHeader').style.display = 'flex';
            
            this.nav('page-launchpad');
            document.getElementById('login-password').value = '';

        } catch (err) {
            // Hiển thị chính xác dòng lỗi bạn yêu cầu
            this.showPopup("zalo: 0358292392, Nhân để được hỗ trợ", false);
        } finally {
            btn.innerHTML = orgText;
            btn.disabled = false;
        }
    },

    logout() {
        if(!confirm("Bạn có chắc chắn muốn đăng xuất?")) return;
        localStorage.removeItem('mmenu_session');
        this.user = "";
        
        document.getElementById('mainHeader').style.display = 'none';
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
            document.getElementById('mainHeader').style.display = 'flex';
            this.nav('page-launchpad');
        } else {
            document.getElementById('mainHeader').style.display = 'none';
            this.nav('page-login');
        }
    },

    updateHeaderUI(fullName) {
        if (document.getElementById('userGreet')) {
            document.getElementById('userGreet').innerText = fullName.toUpperCase();
        }
        if (document.getElementById('userAvatarLetter')) {
            let nameParts = fullName.trim().split(' ');
            let lastName = nameParts[nameParts.length - 1];
            document.getElementById('userAvatarLetter').innerText = lastName.charAt(0).toUpperCase();
        }
    }
});
