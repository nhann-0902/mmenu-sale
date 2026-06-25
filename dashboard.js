// Khởi tạo Supabase Client
const SUPABASE_URL = 'https://ftdndkfymswcjedcznrx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AysJrUeptA0xLEQGDrkRlg_CH-Lmf2i';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cấu hình chung cho Chart.js
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#64748b';

// Hàm chính: Kéo dữ liệu và vẽ biểu đồ
async function initDashboard() {
    try {
        // 1. Kéo dữ liệu từ 3 bảng cùng lúc
        const [revData, leadData, taskData] = await Promise.all([
            supabaseClient.from('data_revenue').select('*'),
            supabaseClient.from('data_leads').select('*'),
            supabaseClient.from('data_tasks').select('*')
        ]);

        if (revData.error) throw revData.error;
        if (leadData.error) throw leadData.error;
        if (taskData.error) throw taskData.error;

        const revenues = revData.data;
        const leads = leadData.data;
        const tasks = taskData.data;

        // ==========================================
        // XỬ LÝ SỐ LIỆU (AGGREGATION)
        // ==========================================
        
        // Data Doanh thu
        let totalRev = 0, totalDebt = 0;
        let sumPM = 0, sumPC = 0, sumOther = 0;
        let sumTuTim = 0, sumMKT = 0, sumGioiThieu = 0;
        let staffSales = {}; // Lưu doanh số theo nhân viên

        revenues.forEach(r => {
            totalRev += Number(r.total_contract) || 0;
            totalDebt += Number(r.debt_amount) || 0;
            sumPM += Number(r.rev_software) || 0;
            sumPC += Number(r.rev_hardware) || 0;
            sumOther += Number(r.rev_other) || 0;
            
            if(r.source === 'Tự tìm') sumTuTim += Number(r.total_contract);
            if(r.source === 'Marketing') sumMKT += Number(r.total_contract);
            if(r.source === 'Giới thiệu') sumGioiThieu += Number(r.total_contract);

            // Cộng dồn doanh số nhân sự
            const staff = r.staff_name || 'Khác';
            if(!staffSales[staff]) staffSales[staff] = 0;
            staffSales[staff] += Number(r.total_contract) || 0;
        });

        // Data Leads
        let totalLeads = 0;
        let sumTiemNang = 0, sumDemo = 0, sumBaoGia = 0, sumFail = 0;
        leads.forEach(l => {
            totalLeads += Number(l.total_lead) || 0;
            sumTiemNang += Number(l.tiem_nang) || 0;
            sumDemo += Number(l.demo_gap) || 0;
            sumBaoGia += Number(l.bao_gia) || 0;
            sumFail += Number(l.tu_choi) || 0;
        });

        // Data Tasks
        let taskDone = 0, taskPending = 0;
        tasks.forEach(t => {
            if (t.status === 'Hoàn thành') taskDone++;
            else taskPending++;
        });

        // Cập nhật các ô KPI Text
        document.getElementById('kpi-revenue').innerText = totalRev.toLocaleString('vi-VN') + ' đ';
        document.getElementById('kpi-debt').innerText = totalDebt.toLocaleString('vi-VN') + ' đ';
        document.getElementById('kpi-lead').innerText = totalLeads.toLocaleString('vi-VN');

        // ==========================================
        // VẼ BIỂU ĐỒ (CHART.JS)
        // ==========================================

        // 1. Cơ cấu sản phẩm (Bar Chart)
        new Chart(document.getElementById('chartProduct'), {
            type: 'bar',
            data: {
                labels: ['Phần mềm', 'Phần cứng', 'Khác'],
                datasets: [{
                    label: 'Doanh thu',
                    data: [sumPM, sumPC, sumOther],
                    backgroundColor: ['#3b82f6', '#f59e0b', '#94a3b8'],
                    borderRadius: 6
                }]
            }
        });

        // 2. Tỷ trọng Nguồn khách (Pie Chart)
        new Chart(document.getElementById('chartSource'), {
            type: 'pie',
            data: {
                labels: ['Tự tìm', 'Marketing', 'Giới thiệu'],
                datasets: [{
                    data: [sumTuTim, sumMKT, sumGioiThieu],
                    backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6']
                }]
            }
        });

        // 3. Thực thu vs Công nợ (Doughnut)
        new Chart(document.getElementById('chartDebt'), {
            type: 'doughnut',
            data: {
                labels: ['Thực thu', 'Công nợ'],
                datasets: [{
                    data: [totalRev - totalDebt, totalDebt],
                    backgroundColor: ['#10b981', '#ef4444']
                }]
            }
        });

        // 4. Phễu Trạng thái Lead (Doughnut)
        new Chart(document.getElementById('chartLeadFunnel'), {
            type: 'doughnut',
            data: {
                labels: ['Tiềm Năng', 'Demo / Gặp', 'Báo Giá', 'Từ Chối'],
                datasets: [{
                    data: [sumTiemNang, sumDemo, sumBaoGia, sumFail],
                    backgroundColor: ['#047857', '#2563eb', '#d97706', '#dc2626']
                }]
            }
        });

        // 5. Tiến độ Task (Half-Doughnut)
        new Chart(document.getElementById('chartTask'), {
            type: 'doughnut',
            data: {
                labels: ['Hoàn Thành', 'Chưa Xong'],
                datasets: [{
                    data: [taskDone, taskPending],
                    backgroundColor: ['#10b981', '#cbd5e1']
                }]
            },
            options: {
                circumference: 180, // Biến thành nửa hình tròn
                rotation: -90
            }
        });

        // 6. BXH Nhân sự (Horizontal Bar)
        const staffNames = Object.keys(staffSales);
        const staffValues = Object.values(staffSales);
        new Chart(document.getElementById('chartStaff'), {
            type: 'bar',
            data: {
                labels: staffNames,
                datasets: [{
                    label: 'Doanh Số',
                    data: staffValues,
                    backgroundColor: '#6366f1',
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y' // Xoay ngang biểu đồ
            }
        });

    } catch (error) {
        console.error('Lỗi khởi tạo Dashboard:', error);
        alert('Lỗi khi tải dữ liệu Dashboard: ' + error.message);
    }
}

// Chạy khởi tạo khi load trang
window.onload = initDashboard;
