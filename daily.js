// Khởi tạo Supabase Client
const SUPABASE_URL = 'https://ftdndkfymswcjedcznrx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AysJrUeptA0xLEQGDrkRlg_CH-Lmf2i';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Đặt ngày hiện tại mặc định cho ô chọn ngày
document.getElementById('lead-date').value = new Date().toISOString().split('T')[0];

// Mảng lưu log các task đã check done trong ngày (để gửi kèm báo cáo)
let taskNotesToday = [];

// 1. Hàm Kéo danh sách Task chưa hoàn thành (Để user check done)
async function fetchMyPendingTasks() {
    const tbody = document.getElementById('my-tasks-body');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải task...</td></tr>';

    try {
        const { data, error } = await supabaseClient
            .from('data_tasks')
            .select('*')
            .eq('status', 'Chưa hoàn thành') // Chỉ lấy task chưa xong
            .order('deadline', { ascending: true }); // Sắp hạn lên đầu

        if (error) throw error;
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #047857;">Tuyệt vời! Bạn không còn nhiệm vụ nào tồn đọng.</td></tr>';
            return;
        }

        data.forEach(task => {
            const tr = document.createElement('tr');
            
            // Xử lý cảnh báo màu sắc hạn chót
            const today = new Date().toISOString().split('T')[0];
            let deadlineStyle = '';
            if (task.deadline && task.deadline < today) {
                deadlineStyle = 'color: #dc2626; font-weight: bold;'; // Đỏ (Quá hạn)
            } else if (task.deadline === today) {
                deadlineStyle = 'color: #d97706; font-weight: bold;'; // Cam (Hôm nay)
            }

            tr.innerHTML = `
                <td>${new Date(task.created_at).toLocaleDateString('vi-VN')}</td>
                <td>${task.content}</td>
                <td style="${deadlineStyle}">${task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN') : '-'}</td>
                <td>
                    <button class="btn-check-done" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;" onclick="markTaskDone(${task.id}, '${task.content}')">
                        <i class="fa-solid fa-check"></i> Tích xong
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Lỗi khi tải task cá nhân:', error);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
    }
}

// 2. Hàm Tích Xong (Update status thành Hoàn thành)
window.markTaskDone = async function(taskId, taskContent) {
    if(!confirm('Xác nhận đã hoàn thành công việc này?')) return;

    try {
        const { error } = await supabaseClient
            .from('data_tasks')
            .update({ 
                status: 'Hoàn thành',
                updated_at: new Date().toISOString()
            })
            .eq('id', taskId);

        if (error) throw error;
        
        alert('Đã cập nhật hoàn thành!');
        taskNotesToday.push(taskContent); // Lưu log lại để chèn vào báo cáo ngày
        fetchMyPendingTasks(); // Tải lại bảng

    } catch (error) {
        console.error('Lỗi cập nhật task:', error);
        alert('Lỗi: ' + error.message);
    }
};

// 3. Hàm Đẩy Báo Cáo Ngày (Insert vào data_leads)
document.getElementById('btn-submit-lead').addEventListener('click', async () => {
    const date = document.getElementById('lead-date').value;
    
    if (!date) {
        alert('Vui lòng chọn ngày báo cáo!');
        return;
    }

    // Parse số liệu (trống thì mặc định là 0)
    const total = parseInt(document.getElementById('lead-total').value) || 0;
    const nhan = parseInt(document.getElementById('lead-nhan').value) || 0;
    const tu = parseInt(document.getElementById('lead-tu').value) || 0;
    const tiemnang = parseInt(document.getElementById('lead-tiemnang').value) || 0;
    const demo = parseInt(document.getElementById('lead-demo').value) || 0;
    const baogia = parseInt(document.getElementById('lead-baogia').value) || 0;
    const fail = parseInt(document.getElementById('lead-fail').value) || 0;

    // Log các task đã làm
    const notes = taskNotesToday.length > 0 ? "Các task đã xong hôm nay: " + taskNotesToday.join(" | ") : "";

    const btn = document.getElementById('btn-submit-lead');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
    btn.disabled = true;

    try {
        const { error } = await supabaseClient
            .from('data_leads')
            .insert([{ 
                date: date,
                staff_name: 'Sales Team', // Sẽ thay bằng tên nhân sự khi có tính năng đăng nhập
                total_lead: total,
                lead_nhan: nhan,
                lead_tu: tu,
                tiem_nang: tiemnang,
                demo_gap: demo,
                bao_gia: baogia,
                tu_choi: fail,
                task_notes: notes
            }]);

        if (error) throw error;
        
        alert('Gửi báo cáo ngày thành công!');
        
        // Reset các ô nhập liệu
        document.getElementById('lead-total').value = '';
        document.getElementById('lead-nhan').value = '';
        document.getElementById('lead-tu').value = '';
        document.getElementById('lead-tiemnang').value = '';
        document.getElementById('lead-demo').value = '';
        document.getElementById('lead-baogia').value = '';
        document.getElementById('lead-fail').value = '';
        taskNotesToday = []; // Reset log

    } catch (error) {
        console.error('Lỗi gửi báo cáo:', error);
        alert('Lỗi: ' + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// Khởi chạy lấy danh sách task khi load trang
window.onload = fetchMyPendingTasks;
