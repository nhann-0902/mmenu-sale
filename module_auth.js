Object.assign(window.App, {async login() {const un = document.getElementById('login-username').value.trim();const pw = document.getElementById('login-password').value.trim();

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
        // Kiểm tra nếu đúng là lỗi sai mật khẩu thì bung popup troll
        if (err.message === "WRONG_CREDENTIALS") {
            const imgBase64 = "data:image/jpeg;base64,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";
            const errorHtml = `
                <div style="text-align: center;">
                    <img src="${imgBase64}" alt="Troll Image" style="max-width: 150px; border-radius: 8px; margin-bottom: 10px;" />
                    <br/>
                    <b>Sai thông tin đăng nhập rồi lêu lêu!<br/>zalo: 0358292392, Nhân để được hỗ trợ</b>
                </div>
            `;
            this.showPopup(errorHtml, false);
        } else {
            // Xử lý các lỗi mạng hoặc lỗi Supabase khác (nếu có) để tránh hiển thị ảnh troll lung tung
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
