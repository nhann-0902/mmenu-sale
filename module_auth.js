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
                .from('sys_users')
                .select('*')
                .eq('username', un)
                .eq('password', pw)
                .single(); 

            if (error || !data) {
                // Ném ra một lỗi cụ thể để nhận biết việc nhập sai tài khoản/mật khẩu
                throw new Error("WRONG_CREDENTIALS");
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
            if (err.message === "WRONG_CREDENTIALS") {
                // SỬA TẠI ĐÂY: Dùng link ảnh trực tiếp thay vì base64 để tránh lỗi
                // Bạn có thể thay link này bằng link ảnh troll của bạn
                const imageUrl = "https://theselfishmeme.co.uk/wp-content/uploads/2025/09/gau-truc-meme-mat-tham-4.webp"; 

                const errorHtml = `
                    <div style="text-align: center;">
                        <img src="${imageUrl}" alt="Troll Image" style="max-width: 150px; border-radius: 8px; margin-bottom: 10px; display: inline-block;" />
                        <br/>
                        <b>Sai thông tin đăng nhập rồi lêu lêu!<br/>Zalo: 0358292392 (Nhân) để được hỗ trợ</b>
                    </div>
                `;
                this.showPopup(errorHtml, false);
            } else {
                this.showPopup("Lỗi kết nối hoặc hệ thống, vui lòng thử lại sau!", false);
            }
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
