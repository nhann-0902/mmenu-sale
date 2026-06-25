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
        
        const staffSelect = document.getElementById('filterTaskStaff');
        let currentStaff = staffSelect ? staffSelect.value : 'ALL';
        safeSet('filterTaskStaff', `<option value="ALL">Tất cả nhân viên</option>` + users.map(x => `<option value="${x}">${x}</option>`).join(''), 'html');
        if (staffSelect) staffSelect.value = currentStaff;

        try {
            const { data, error } = await supabaseClient.from('data_tasks').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            
            this.allTasksList = data.map(t => {
                let rawTime = t.deadline ? new Date(t.deadline).getTime() : 0;
                let isOverdue = (rawTime > 0 && rawTime < new Date().getTime() && t.status !== "Hoàn thành");
                return {
                    id: t.id, ngayGiao: formatDateStr(t.created_at), nguoiGiao: t.giver || '', nguoiNhan: t.receiver || '',
                    noiDung: t.content || '', thoiHan: formatDateStr(t.deadline), trangThai: t.status || 'Chưa hoàn thành', 
                    isOverdue: isOverdue, rawCreatedAt: t.created_at
                };
            });
            this.renderAllTasks();
        } catch (error) {
            this.showPopup("Lỗi kết nối Kho nhiệm vụ", false);
        } finally {
            this.hideL();
            this.toggleBulkActionButton(); // Reset nút gom nhóm
        }
    },

    renderAllTasks() {
        const elStaff = document.getElementById('filterTaskStaff');
        const elStatus = document.getElementById('filterTaskStatus');
        const elSort = document.getElementById('filterTaskSort');
        
        let fStaff = elStaff ? elStaff.value : 'ALL';
        let fStatus = elStatus ? elStatus.value : 'ALL';
        let fSort = elSort ? elSort.value : 'DESC';
        
        let filteredList = this.allTasksList.filter(t => { 
          return ((fStaff === 'ALL') || (t.nguoiNhan === fStaff || t.nguoiGiao === fStaff)) && 
                 ((fStatus === 'ALL') || (t.trangThai === fStatus)); 
        });

        // Xắp xếp theo ngày
        filteredList.sort((a, b) => {
            let timeA = new Date(a.rawCreatedAt).getTime();
            let timeB = new Date(b.rawCreatedAt).getTime();
            return fSort === 'ASC' ? (timeA - timeB) : (timeB - timeA);
        });

        let h = '';
        filteredList.forEach(t => {
          let isDone = t.trangThai === 'Hoàn thành'; 
          let borderClass = isDone ? 'task-done' : (t.isOverdue ? 'task-alert-overdue' : 'task-normal'); 
          let statusColor = isDone ? 'var(--success)' : 'var(--warning)';
          let shortText = t.noiDung.length > 100 ? t.noiDung.substring(0, 100) + "..." : t.noiDung;
          
          // Nút Checkbox chỉ hiện khi task chưa hoàn thành
          let checkboxHtml = '';
          if (!isDone) {
              checkboxHtml = `<input type="checkbox" class="task-multi-check" value="${t.id}" onchange="App.toggleBulkActionButton()" style="width: 18px; height: 18px; accent-color: var(--success); cursor: pointer; margin-top: 2px;">`;
          }

          h += `
            <div class="card ${borderClass}" style="padding: 12px; margin-bottom: 12px; display: flex; gap: 12px; align-items: flex-start;">
              ${checkboxHtml ? `<div>${checkboxHtml}</div>` : ''}
              <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div style="font-weight: 800; font-size: 13px; color: var(--primary); padding-right: 15px; word-break: break-word; line-height: 1.4;">${shortText}</div>
                    <i class="fa-solid fa-eye" style="color: var(--accent); cursor: pointer; font-size: 16px; padding: 5px; background: rgba(59,130,246,0.1); border-radius: 6px; flex-shrink: 0;" onclick="App.viewTaskDetail('${t.id}')" title="Xem chi tiết"></i>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border); padding-top: 8px;">
                    <div style="font-size: 10px; color: var(--text-light);">Giao bởi: <b>${t.nguoiGiao}</b> ➔ <b>${t.nguoiNhan}</b><br><span style="color:${statusColor}; font-weight:800;">${t.trangThai.toUpperCase()}</span></div>
                    <div style="text-align: right;"><span style="font-size:9px; color:var(--text-light); display:block;">Tạo: ${t.ngayGiao}</span><span style="font-size:10px; color:var(--danger); font-weight:700;">Hạn: ${t.thoiHan}</span></div>
                  </div>
              </div>
            </div>`;
        });
        
        safeSet('allTasksContainer', h || '<div style="text-align:center; padding: 20px; font-style:italic; color: var(--text-light);">Không tìm thấy nhiệm vụ nào.</div>', 'html');
        this.toggleBulkActionButton(); // Ẩn nút nếu chuyển tab lọc
    },

    // Hàm ẩn/hiện nút "Hoàn thành nhiều task"
    toggleBulkActionButton() {
        let checkedBoxes = document.querySelectorAll('.task-multi-check:checked');
        let bulkContainer = document.getElementById('bulkActionContainer');
        if (checkedBoxes.length > 0) {
            if (bulkContainer) bulkContainer.style.display = 'block';
            safeSet('bulkCount', checkedBoxes.length);
        } else {
            if (bulkContainer) bulkContainer.style.display = 'none';
        }
    },

    // Hàm Xác nhận và Gọi API Hoàn thành
    confirmCompleteMultipleTasks() {
        let checkedBoxes = document.querySelectorAll('.task-multi-check:checked');
        if (checkedBoxes.length === 0) return;
        
        let idsToComplete = Array.from(checkedBoxes).map(cb => cb.value);

        // Hiển thị Popup xác nhận cực đẹp từ SweetAlert2
        Swal.fire({
          title: 'Xác nhận hoàn thành?',
          text: `Bạn sắp đánh dấu XONG ${idsToComplete.length} nhiệm vụ đã chọn.`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#10b981', // Màu xanh success
          cancelButtonColor: '#ef4444',  // Màu đỏ danger
          confirmButtonText: 'Có, Hoàn thành ngay!',
          cancelButtonText: 'Hủy bỏ'
        }).then(async (result) => {
          if (result.isConfirmed) {
              this.showL();
              try {
                  const { error } = await supabaseClient.from('data_tasks')
                      .update({ status: 'Hoàn thành', updated_at: new Date().toISOString() })
                      .in('id', idsToComplete);
                  
                  if (error) throw error;
                  
                  this.showPopup(`Tuyệt vời! Đã nghiệm thu ${idsToComplete.length} nhiệm vụ.`, true);
                  this.loadAllTasks(); // Tải lại danh sách
              } catch (err) {
                  this.showPopup("Lỗi hệ thống: " + err.message, false);
              } finally {
                  this.hideL();
              }
          }
        });
    },

    // Hàm mở Popup xem chi tiết
    viewTaskDetail(id) {
        let task = this.allTasksList.find(t => String(t.id) === String(id));
        if (task) {
            safeSet('taskDetailContent', task.noiDung);
            const modal = document.getElementById('taskDetailPopup');
            if(modal) modal.classList.add('active');
        }
    },
    
    closeTaskDetail(e) {
        if (e && e.target && e.target.id !== 'taskDetailPopup') return; 
        const modal = document.getElementById('taskDetailPopup');
        if(modal) modal.classList.remove('active');
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
          div.style.cssText = "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-top: 4px solid var(--accent);";
          div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed #cbd5e1;">
                <span style="font-size:11px; font-weight:800; color:var(--primary); text-transform: uppercase;"><i class="fa-solid fa-thumbtack" style="color:var(--accent); margin-right: 6px;"></i> Nhiệm vụ mới</span>
                <i class="fa-solid fa-trash" style="color:var(--danger); cursor:pointer; font-size: 14px; padding: 5px;" onclick="this.closest('.assign-block-item').remove()" title="Xóa block này"></i>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 12px;">
                <div><label style="font-size: 10px; font-weight: 700; color: var(--text-light); margin-bottom: 4px; display: block;">NGƯỜI GIAO</label><select class="form-control assign-giver" style="padding:10px; font-size:12px; background-color: #f8fafc; border-color: #cbd5e1;">${giverOpts}</select></div>
                <div><label style="font-size: 10px; font-weight: 700; color: var(--text-light); margin-bottom: 4px; display: block;">NGƯỜI NHẬN</label><select class="form-control assign-receiver" style="padding:10px; font-size:12px; border-color: #cbd5e1;">${receiverOpts}</select></div>
                <div><label style="font-size: 10px; font-weight: 700; color: var(--text-light); margin-bottom: 4px; display: block;">THỜI HẠN</label><input type="date" class="form-control assign-date" value="${todayStr}" style="padding:10px; font-size:12px; border-color: #cbd5e1;"></div>
            </div>
            <div><label style="font-size: 10px; font-weight: 700; color: var(--text-light); margin-bottom: 4px; display: block;">NỘI DUNG</label><textarea class="form-control assign-content" rows="2" placeholder="Mô tả chi tiết nhiệm vụ cần thực hiện..." style="padding:10px; font-size:12px; border-color: #cbd5e1; resize: vertical;"></textarea></div>
          `;
          area.appendChild(div);
        }
    },

    async submitAssignTasks() {
        let tasksToAssign = []; let hasError = false;
        document.querySelectorAll('.assign-block-item').forEach(block => {
          const giver = block.querySelector('.assign-giver').value; 
          const rec = block.querySelector('.assign-receiver').value; 
          const date = block.querySelector('.assign-date').value; 
          const con = block.querySelector('.assign-content').value;
          if(rec && giver && con.trim()) { tasksToAssign.push({ giver: giver, receiver: rec, deadline: date || null, content: con, status: 'Chưa hoàn thành' }); } 
          else if(con.trim() && (!rec || !giver)) { hasError = true; }
        });
        if(hasError) { alert("Lỗi: Có nhiệm vụ đã nhập nội dung nhưng chưa chọn đủ Người giao và Người nhận!"); return; }
        if(tasksToAssign.length === 0) { alert("Vui lòng điền nội dung và chọn người thực hiện!"); return; }
        
        this.showL();
        try {
            const { error } = await supabaseClient.from('data_tasks').insert(tasksToAssign);
            if(error) throw error;
            this.showPopup("Phát hành thành công " + tasksToAssign.length + " nhiệm vụ!", true); 
            this.nav('page-task-list'); 
        } catch(error) { this.showPopup("Lỗi phát hành: " + error.message, false); } finally { this.hideL(); }
    }
});
