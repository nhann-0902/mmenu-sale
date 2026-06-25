Object.assign(window.App, {
    allTasksList: [],
    
    async loadAllTasks() {
        this.showL();
        const elFilter = document.getElementById('filterTaskStaff');
        if(elFilter) elFilter.innerHTML = `<option value="ALL">Tất cả nhân viên</option>` + this.staffList.map(x => `<option value="${x}">${x}</option>`).join('');
        
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
        let fStaff = document.getElementById('filterTaskStaff') ? document.getElementById('filterTaskStaff').value : 'ALL';
        let fStatus = document.getElementById('filterTaskStatus') ? document.getElementById('filterTaskStatus').value : 'ALL';
        
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
        
        const container = document.getElementById('allTasksContainer');
        if(container) container.innerHTML = h || '<div style="text-align:center; padding: 20px; font-style:italic; color: var(--text-light);">Không tìm thấy nhiệm vụ nào.</div>';
    },

    addAssignBlock(count) {
        const area = document.getElementById('assignFormContainer'); 
        if(!area) return;
        const todayStr = new Date().toISOString().split('T')[0];
        let receiverOpts = `<option value="">Thực hiện...</option>` + this.staffList.map(x => `<option value="${x}">${x}</option>`).join('');
        
        for(let i = 0; i < count; i++) {
          const div = document.createElement('div'); 
          div.className = 'card assign-block-item'; 
          div.style.cssText = "padding: 12px; background: rgba(248, 250, 252, 0.8); border: 1px solid var(--border); margin-bottom: 0;";
          div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"><span style="font-size:10px; font-weight:800; color:var(--text-light);"><i class="fa-solid fa-thumbtack" style="color:var(--accent);"></i> BLOCK NHIỆM VỤ</span><i class="fa-solid fa-trash" style="color:var(--danger); cursor:pointer;" onclick="this.parentElement.parentElement.remove()"></i></div>
            <div class="grid-2" style="margin-bottom:10px;"><div><select class="form-control assign-receiver" style="padding:10px; font-size:12px;">${receiverOpts}</select></div><div><input type="date" class="form-control assign-date" value="${todayStr}" style="padding:10px; font-size:12px;"></div></div>
            <textarea class="form-control assign-content" rows="2" placeholder="Nhập nội dung công việc..." style="padding:10px; font-size:12px;"></textarea><input type="hidden" class="assign-giver" value="${this.user}">
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
          if(rec && con.trim()) { tasksToAssign.push({ giver: giver, receiver: rec, deadline: date || null, content: con, status: 'Chưa hoàn thành' }); } 
          else if(con.trim() && !rec) { hasError = true; }
        });
        
        if(hasError) { alert("Lỗi: Có nhiệm vụ đã nhập nội dung nhưng chưa chọn Người thực hiện!"); return; }
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
