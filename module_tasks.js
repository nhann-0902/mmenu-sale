Object.assign(window.App, {
    allTasksList: [],
    dbStaffList: [], 

    async getDbStaffList() {
        if (this.dbStaffList && this.dbStaffList.length > 0) return this.dbStaffList;
        try {
            const { data, error } = await supabaseClient.from('sys_users').select('full_name').order('full_name');
            if (!error && data) {
                this.dbStaffList = data.map(u => u.full_name);
                return this.dbStaffList;
            }
        } catch(e) { console.error('Lỗi tải danh sách nhân sự:', e); }
        return this.staffList; 
    },
    
    async loadAllTasks() {
        this.showL();
        let users = await this.getDbStaffList();
        safeSet('filterTaskStaff', `<option value="ALL">Tất cả nhân viên</option>` + users.map(x => `<option value="${x}">${x}</option>`).join(''), 'html');
        
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
        const elStaff = document.getElementById('filterTaskStaff');
        const elStatus = document.getElementById('filterTaskStatus');
        let fStaff = elStaff ? elStaff.value : 'ALL';
        let fStatus = elStatus ? elStatus.value : 'ALL';
        
        let filteredList = this.allTasksList.filter(t => { 
          return ((fStaff === 'ALL') || (t.nguoiNhan === fStaff || t.nguoiGiao === fStaff)) && 
                 ((fStatus === 'ALL') || (t.trangThai === fStatus)); 
        });

        let h = '';
        filteredList.forEach(t => {
          let isDone = t.trangThai === 'Hoàn thành'; 
          let borderClass = isDone ? 'task-done' : (t.isOverdue ? 'task-alert-overdue' : 'task-normal'); 
          let statusColor = isDone ? 'var(--success)' : 'var(--warning)';
          h += `
            <div class="card ${borderClass}" style="padding: 12px; margin-bottom: 12px;">
              <div style="font-weight: 800; font-size: 13px; color: var(--primary); margin-bottom: 8px;">${t.noiDung}</div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border); padding-top: 8px;">
                <div style="font-size: 10px; color: var(--text-light);">Giao bởi: <b>${t.nguoiGiao}</b> ➔ <b>${t.nguoiNhan}</b><br><span style="color:${statusColor}; font-weight:800;">${t.trangThai.toUpperCase()}</span></div>
                <div style="text-align: right;"><span style="font-size:9px; color:var(--text-light); display:block;">Tạo: ${t.ngayGiao}</span><span style="font-size:10px; color:var(--danger); font-weight:700;">Hạn: ${t.thoiHan}</span></div>
              </div>
            </div>`;
        });
        
        safeSet('allTasksContainer', h || '<div style="text-align:center; padding: 20px; font-style:italic; color: var(--text-light);">Không tìm thấy nhiệm vụ nào.</div>', 'html');
    },

    async addAssignBlock(count) {
        const area = document.getElementById('assignFormContainer'); 
        if(!area) return;
        const todayStr = new Date().toISOString().split('T')[0];
        
        let users = await this.getDbStaffList();
        let receiverOpts = `<option value="">-- Chọn người nhận --</option>` + users.map(x => `<option value="${x}">${x}</option>`).join('');
        let giverOpts = `<option value="">-- Chọn người giao --</option>` + users.map(x => `<option value="${x}" ${x === this.user ? 'selected' : ''}>${x}</option>`).join('');
        
        for(let i = 0; i < count; i++) {
          const div = document.createElement('div'); 
          div.className = 'assign-block-item fade-in-up'; 
          div.style.cssText = "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-top: 4px solid var(--accent);";
          div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #cbd5e1;"><span style="font-size:12px; font-weight:800; color:var(--primary); text-transform: uppercase;"><i class="fa-solid fa-thumbtack" style="color:var(--accent); margin-right: 6px;"></i> Nhiệm vụ mới</span><i class="fa-solid fa-trash" style="color:var(--danger); cursor:pointer; font-size: 14px; padding: 5px;" onclick="this.closest('.assign-block-item').remove()" title="Xóa block này"></i></div>
            <div class="grid-2" style="margin-bottom:15px; gap: 15px;"><div><label style="font-size: 10px; font-weight: 700; color: var(--text-light); margin-bottom: 6px; display: block;">NGƯỜI GIAO</label><select class="form-control assign-giver" style="padding:12px 14px; font-size:13px; background-color: #f8fafc; border-color: #cbd5e1;">${giverOpts}</select></div><div><label style="font-size: 10px; font-weight: 700; color: var(--text-light); margin-bottom: 6px; display: block;">NGƯỜI NHẬN</label><select class="form-control assign-receiver" style="padding:12px 14px; font-size:13px; border-color: #cbd5e1;">${receiverOpts}</select></div></div>
            <div style="margin-bottom:15px;"><label style="font-size: 10px; font-weight: 700; color: var(--text-light); margin-bottom: 6px; display: block;">THỜI HẠN (DEADLINE)</label><input type="date" class="form-control assign-date" value="${todayStr}" style="padding:12px 14px; font-size:13px; border-color: #cbd5e1;"></div>
            <div><label style="font-size: 10px; font-weight: 700; color: var(--text-light); margin-bottom: 6px; display: block;">NỘI DUNG CÔNG VIỆC</label><textarea class="form-control assign-content" rows="3" placeholder="Mô tả chi tiết nhiệm vụ cần thực hiện..." style="padding:12px 14px; font-size:13px; border-color: #cbd5e1; resize: vertical;"></textarea></div>
          `;
          area.appendChild(div);
        }
    },

    async submitAssignTasks() {
        let tasksToAssign = []; 
        let hasError = false;
        
        document.querySelectorAll('.assign-block-item').forEach(block => {
          const giver = block.querySelector('.assign-giver').value; 
          const rec = block.querySelector('.assign-receiver').value; 
          const date = block.querySelector('.assign-date').value; 
          const con = block.querySelector('.assign-content').value;
          
          if(rec && giver && con.trim()) { 
              tasksToAssign.push({ giver: giver, receiver: rec, deadline: date || null, content: con, status: 'Chưa hoàn thành' }); 
          } else if(con.trim() && (!rec || !giver)) { 
              hasError = true; 
          }
        });
        
        if(hasError) { alert("Lỗi: Có nhiệm vụ đã nhập nội dung nhưng chưa chọn đủ Người giao và Người nhận!"); return; }
        if(tasksToAssign.length === 0) { alert("Vui lòng điền nội dung và chọn người thực hiện!"); return; }
        
        this.showL();
        try {
            const { error } = await supabaseClient.from('data_tasks').insert(tasksToAssign);
            if(error) throw error;
            this.showPopup("Phát hành thành công " + tasksToAssign.length + " nhiệm vụ!", true); 
            this.nav('page-task-list'); 
        } catch(error) {
            this.showPopup("Lỗi phát hành: " + error.message, false);
        } finally {
            this.hideL();
        }
    }
});
