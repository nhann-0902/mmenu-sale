const SUPABASE_URL = 'https://ftdndkfymswcjedcznrx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AysJrUeptA0xLEQGDrkRlg_CH-Lmf2i';

// Đã đổi tên biến thành 'supabaseClient' để không đụng độ với thư viện gốc
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Chức năng Test kết nối và Insert dữ liệu
document.getElementById('btn-test-task').addEventListener('click', async () => {
    // Custom Popup Notification giản lược thay thế alert()
    const btn = document.getElementById('btn-test-task');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
    btn.disabled = true;

    try {
        // Sử dụng biến 'supabaseClient' mới để gọi data
        const { data, error } = await supabaseClient
            .from('DATA_TASKS')
            .insert([
                {
                    giver: 'Admin Test',
                    receiver: 'Toàn Đội Sales',
                    content: 'Test kết nối Frontend - Supabase lần đầu tiên',
                    deadline: new Date().toISOString().split('T')[0],
                    status: 'Chưa hoàn thành'
                }
            ]);

        if (error) throw error;
        
        alert('🎉 Tuyệt vời! Đã kết nối và đẩy Task thành công lên Supabase.');
    } catch (error) {
        console.error('Lỗi kết nối:', error);
        alert('Lỗi: ' + error.message);
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Gửi Task Thử Nghiệm';
        btn.disabled = false;
    }
});
