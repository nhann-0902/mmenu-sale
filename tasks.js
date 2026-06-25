const SUPABASE_URL = 'https://ftdndkfymswcjedcznrx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AysJrUeptA0xLEQGDrkRlg_CH-Lmf2i';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Hàm lấy danh sách Tasks từ Database
async function fetchTasks() {
    const tbody = document.getElementById('task-table-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</td></tr>';

    try {
        const { data, error } = await supabaseClient
            .from('data_tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Chưa có nhiệm vụ nào.</td></tr>';
            return;
        }

        data.forEach(task => {
            let statusClass = 'status-blue';
            let statusText = task.status;
            
            const today = new Date().toISOString().split('T')[0];
            if (task.status === 'Chưa hoàn thành' && task.deadline && task.deadline < today) {
                statusClass = 'status-red';
                statusText = 'Quá hạn';
            } else if (task.status === 'Hoàn thành') {
                statusClass = 'status-green';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(task.created_at).toLocaleDateString('vi-VN')}</td>
                <td><strong>${task.receiver || '-'}</strong></td>
                <td>${task.content || '-'}</td>
                <td>${task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN') : '-'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Lỗi khi tải tasks:', error);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
    }
}

// Hàm Giao việc mới (Insert)
document.getElementById('btn-add-task').addEventListener('click', async () => {
    const receiver = document.getElementById('task-receiver').value.trim();
    const content = document.getElementById('task-content').value.trim();
    const deadline = document.getElementById('task-deadline').value;

    if (!receiver || !content) {
        alert('Vui lòng nhập Người nhận và Nội dung công việc!');
        return;
    }

    const btn = document.getElementById('btn-add-task');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
    btn.disabled = true;

    try {
        const { error } = await supabaseClient
            .from('data_tasks')
            .insert([{ 
                giver: 'Cấp Quản Lý',
                receiver: receiver, 
                content: content, 
                deadline: deadline || null,
                status: 'Chưa hoàn thành' 
            }]);

        if (error) throw error;
        
        document.getElementById('task-receiver').value = '';
        document.getElementById('task-content').value = '';
        document.getElementById('task-deadline').value = '';
        fetchTasks(); 

    } catch (error) {
        console.error('Lỗi giao việc:', error);
        alert('Lỗi giao việc: ' + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// Nút làm mới bảng
document.getElementById('btn-refresh').addEventListener('click', fetchTasks);

// Chạy hàm kéo dữ liệu ngay khi tải trang
window.onload = fetchTasks;
