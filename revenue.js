// Khởi tạo Supabase Client
const SUPABASE_URL = 'https://ftdndkfymswcjedcznrx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AysJrUeptA0xLEQGDrkRlg_CH-Lmf2i';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. Lắng nghe sự kiện để TỰ ĐỘNG TÍNH TOÁN (Dynamic Form)
const calcInputs = document.querySelectorAll('.calc-input');
calcInputs.forEach(input => {
    input.addEventListener('input', calculateTotals);
});

function calculateTotals() {
    // Lấy giá trị từ các ô nhập, nếu rỗng thì tính là 0
    const sw = parseFloat(document.getElementById('rev-software').value) || 0;
    const hw = parseFloat(document.getElementById('rev-hardware').value) || 0;
    const other = parseFloat(document.getElementById('rev-other').value) || 0;
    const paid = parseFloat(document.getElementById('rev-paid').value) || 0;

    // Tính Tổng và Công nợ
    const totalContract = sw + hw + other;
    const debtAmount = totalContract - paid;

    // Hiển thị ra UI (thêm dấu phẩy cho dễ đọc)
    document.getElementById('label-total').innerText = totalContract.toLocaleString('vi-VN');
    document.getElementById('label-debt').innerText = debtAmount.toLocaleString('vi-VN');
}

// 2. Hàm kéo dữ liệu hiển thị lên Bảng
async function fetchRevenue() {
    const tbody = document.getElementById('rev-table-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</td></tr>';

    try {
        const { data, error } = await supabaseClient
            .from('data_revenue')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Chưa có dữ liệu doanh thu.</td></tr>';
            return;
        }

        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.transaction_date ? new Date(row.transaction_date).toLocaleDateString('vi-VN') : '-'}</td>
                <td><strong>${row.customer_name || '-'}</strong></td>
                <td>${row.contract_type || '-'}</td>
                <td style="color: #047857; font-weight: 500;">${Number(row.total_contract).toLocaleString('vi-VN')}</td>
                <td>${Number(row.paid_amount).toLocaleString('vi-VN')}</td>
                <td style="color: ${row.debt_amount > 0 ? '#b91c1c' : '#475569'}; font-weight: 500;">
                    ${Number(row.debt_amount).toLocaleString('vi-VN')}
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Lỗi khi tải doanh thu:', error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Lỗi tải dữ liệu: ${error.message}</td></tr>`;
    }
}

// 3. Hàm Đẩy dữ liệu (Insert) lên Supabase
document.getElementById('btn-submit-rev').addEventListener('click', async () => {
    const date = document.getElementById('rev-date').value;
    const customer = document.getElementById('rev-customer').value.trim();
    const source = document.getElementById('rev-source').value;
    const type = document.getElementById('rev-type').value;

    if (!date || !customer || !type) {
        alert('Vui lòng nhập đủ: Ngày, Khách hàng và Loại hợp đồng!');
        return;
    }

    // Lấy lại giá trị số để lưu Database
    const rev_sw = parseFloat(document.getElementById('rev-software').value) || 0;
    const rev_hw = parseFloat(document.getElementById('rev-hardware').value) || 0;
    const rev_other = parseFloat(document.getElementById('rev-other').value) || 0;
    const rev_paid = parseFloat(document.getElementById('rev-paid').value) || 0;
    
    const total_contract = rev_sw + rev_hw + rev_other;
    const debt_amount = total_contract - rev_paid;

    const btn = document.getElementById('btn-submit-rev');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
    btn.disabled = true;

    try {
        const { error } = await supabaseClient
            .from('data_revenue')
            .insert([{ 
                transaction_date: date,
                staff_name: 'Sales Team', 
                source: source,
                contract_type: type,
                customer_name: customer,
                rev_software: rev_sw,
                rev_hardware: rev_hw,
                rev_other: rev_other,
                total_contract: total_contract,
                paid_amount: rev_paid,
                debt_amount: debt_amount
            }]);

        if (error) throw error;
        
        // Cú pháp Reset Form
        document.getElementById('rev-date').value = '';
        document.getElementById('rev-customer').value = '';
        document.getElementById('rev-source').value = '';
        document.getElementById('rev-type').value = '';
        document.querySelectorAll('.calc-input').forEach(input => input.value = '');
        calculateTotals(); // Reset lại nhãn tính toán về 0
        
        // Tải lại bảng
        fetchRevenue(); 
        alert('Lưu doanh thu thành công!');

    } catch (error) {
        console.error('Lỗi lưu doanh thu:', error);
        alert('Lỗi: ' + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// Nút làm mới và tự động fetch
document.getElementById('btn-refresh-rev').addEventListener('click', fetchRevenue);
window.onload = fetchRevenue;
