Object.assign(window.App, {
    scheduleDates: [],

    async loadSchedule() {
        this.showL();
        try {
            // 1. Tạo mảng 7 ngày tính từ hôm nay
            this.scheduleDates = [];
            for(let i = 0; i < 7; i++) {
                let d = new Date();
                d.setDate(d.getDate() + i);
                this.scheduleDates.push(d.toISOString().split('T')[0]);
            }

            // 2. Kéo danh sách nhân sự & sắp xếp A-Z
            let staff = await this.getDbStaffList();
            staff.sort((a, b) => a.localeCompare(b, 'vi')); 

            // 3. Kéo dữ liệu lịch từ Database
            const { data, error } = await supabaseClient
                .from('data_schedule')
                .select('*')
                .in('date', this.scheduleDates);
            
            if (error) throw error;
            
            let dbMap = {};
            (data || []).forEach(row => { dbMap[`${row.staff_name}_${row.date}`] = row; });

            // 4. Vẽ giao diện bảng
            let html = '';
            staff.forEach(name => {
                html += `<div class="card" style="padding:0; overflow:hidden; margin-bottom:20px; border: 1px solid var(--border);">
                    <div style="padding:10px 15px; background:var(--primary); color:white; font-weight:800; font-size:13px; text-transform: uppercase;">
                        <i class="fa-solid fa-user-tie" style="color:var(--accent); margin-right:8px;"></i>${name}
                    </div>
                    <div style="overflow-x:auto;">
                        <table class="sched-table">
                            <thead><tr><th class="sched-row-label">Ca</th>`;
                
                // In tiêu đề ngày (VD: 25/06)
                this.scheduleDates.forEach(d => {
                    let parts = d.split('-');
                    html += `<th>${parts[2]}/${parts[1]}</th>`;
                });
                html += `</tr></thead><tbody>`;

                const shifts = ['Sáng', 'Trưa', 'Chiều'];
                const shiftKeys = ['shift_morning', 'shift_noon', 'shift_afternoon'];

                shifts.forEach((shiftName, sIdx) => {
                    html += `<tr><td class="sched-row-label">${shiftName}</td>`;
                    this.scheduleDates.forEach(d => {
                        let key = `${name}_${d}`;
                        let status = 'Rỗi'; 
                        if (dbMap[key] && dbMap[key][shiftKeys[sIdx]]) status = dbMap[key][shiftKeys[sIdx]];
                        
                        let statusClass = status === 'Bận' ? 'sched-ban' : (status.toLowerCase() === 'demo' ? 'sched-demo' : 'sched-roi');

                        html += `<td class="sched-cell ${statusClass}" data-staff="${name}" data-date="${d}" data-shift="${shiftKeys[sIdx]}" onclick="App.toggleSchedule(this)">${status}</td>`;
                    });
                    html += `</tr>`;
                });
                html += `</tbody></table></div></div>`;
            });

            safeSet('scheduleContainer', html, 'html');

        } catch (err) {
            this.showPopup("Lỗi tải lịch làm việc!", false);
        } finally {
            this.hideL();
        }
    },

    // Xử lý Click vòng lặp: Rỗi -> Demo -> Bận -> Rỗi
    toggleSchedule(cell) {
        let current = cell.innerText.trim().toLowerCase();
        let nextStatus = 'Rỗi'; let newClass = 'sched-roi';

        if (current === 'rỗi') { nextStatus = 'Demo'; newClass = 'sched-demo'; } 
        else if (current === 'demo') { nextStatus = 'Bận'; newClass = 'sched-ban'; } 
        else if (current === 'bận') { nextStatus = 'Rỗi'; newClass = 'sched-roi'; }

        cell.innerText = nextStatus;
        cell.className = `sched-cell ${newClass}`;
    },

    // Lưu toàn bộ dữ liệu đang hiển thị lên DB
    async saveSchedule() {
        this.showL();
        try {
            let cells = document.querySelectorAll('.sched-cell');
            let updates = {};

            cells.forEach(c => {
                let staff = c.getAttribute('data-staff');
                let date = c.getAttribute('data-date');
                let shift = c.getAttribute('data-shift');
                let status = c.innerText.trim();

                let key = `${staff}_${date}`;
                if (!updates[key]) updates[key] = { staff_name: staff, date: date };
                updates[key][shift] = status;
            });

            // Upsert (Cập nhật nếu đã có, Thêm mới nếu chưa)
            const { error } = await supabaseClient
                .from('data_schedule')
                .upsert(Object.values(updates), { onConflict: 'staff_name, date' });

            if (error) throw error;
            this.showPopup("Đã lưu lịch làm việc thành công!", true);
        } catch(err) {
            this.showPopup("Lỗi lưu lịch: " + err.message, false);
        } finally {
            this.hideL();
        }
    }
});
