// Gắn các hàm logic của Kho Nhiệm Vụ vào Object App
Object.assign(window.App, {
    allTasksList: [],
    
    async loadAllTasks() {
        this.showL();
        document.getElementById('filterTaskStaff').innerHTML = `<option value="ALL">Tất cả nhân viên</option>` + this.staffList.map(x => `<option value="${x}">${x}</option>`).join('');
        
        try {
            const { data, error } = await supabaseClient.from('data_tasks').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            
            this.allTasksList = data.map(t => {
                let rawTime = t.deadline ? new Date(t.deadline).getTime() : 0;
                let isOverdue = (rawTime > 0 && rawTime < new Date().getTime() && t.status !== "Hoàn thành");
                return {
                    id: t.id, ngayGiao: formatDateStr(t.created_at), nguoiGiao: t.giver || '', nguoiNhan: t.receiver || '',
                    noiDung: t.content || '', thoiHan: formatDateStr(t.deadline), trangThai: t.status || 'Chưa hoàn thành', isOverdue: isOverdue
                };
            });
            this.renderAllTasks();
        } catch (error) {
            this.showPopup("Lỗi kết nối Kho nhiệm vụ", false);
        } finally {
            this.hideL();
        }
    },

    renderAllTasks() {
        // ... (Giữ nguyên logic render UI như ở code cũ)
    },

    addAssignBlock(count) {
        // ... (Giữ nguyên logic thêm block giao việc)
    },

    async submitAssignTasks() {
        // ... (Giữ nguyên logic gửi block giao việc lên Supabase)
    }
});
