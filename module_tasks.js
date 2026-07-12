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
        
        // ĐÃ SỬA: Tách riêng dropdown Người Giao và Người Nhận
        const giverSelect = document.getElementById('filterTaskGiver');
        let currentGiver = giverSelect ? giverSelect.value : 'ALL';
        safeSet('filterTaskGiver', `<option value="ALL">Tất cả</option>` + users.map(x => `<option value="${x}">${x}</option>`).join(''), 'html');
        if (giverSelect) giverSelect.value = currentGiver;

        const recSelect = document.getElementById('filterTaskReceiver');
        let currentRec = recSelect ? recSelect.value : 'ALL';
        safeSet('filterTaskReceiver', `<option value="ALL">Tất cả</option>` + users.map(x => `<option value="${x}">${x}</option>`).join(''), 'html');
        if (recSelect) recSelect.value = currentRec;

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
            this.toggleBulkActionButton(); 
        }
    },

    renderAllTasks() {
        const elGiver = document.getElementById('filterTaskGiver');
        const elRec = document.getElementById('filterTaskReceiver');
        const elStatus = document.getElementById('filterTaskStatus');
        const elSort = document.getElementById('filterTaskSort');
        
        let fGiver = elGiver ? elGiver.value : 'ALL';
        let fRec = elRec ? elRec.value : 'ALL';
        let fStatus = elStatus ? elStatus.value : 'ALL';
        let fSort = elSort ? elSort.value : 'DESC';
        
        let filteredList = this.allTasksList.filter(t => { 
          return ((fGiver === 'ALL') || (t.nguoiGiao === fGiver)) && 
                 ((fRec === 'ALL') || (t.nguoiNhan === fRec)) && 
                 ((fStatus === 'ALL') || (t.trangThai === fStatus)); 
        });

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
          
          let checkboxHtml = '';
          if (!isDone) {
              checkboxHtml = `<input type="checkbox" class="task-multi-check" value="${t.id}" onchange="App.toggleBulkActionButton()" style="width: 18px; height: 18px; accent-color: var(--success); cursor: pointer; margin-top: 2px;">`;
          }

          h += `
            <div class="card ${borderClass}" style="padding: 15px; margin-bottom: 12px; display: flex; gap: 15px; align-items: flex-start;">
              ${checkboxHtml ? `<div>${checkboxHtml}</div>` : ''}
              <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div style="font-weight: 800; font-size: 13px; color: var(--primary); padding-right: 15px; word-break: break-word; line-height: 1.5;">${shortText}</div>
                    <i class="fa-solid fa-eye" style="color: var(--accent); cursor: pointer; font-size: 16px; padding: 6px; background: rgba(59,130,246,0.1); border-radius: 8px; flex-shrink: 0; transition: 0.2s;" onmouseover="this.style.background='var(--accent)'; this.style.color='#fff';" onmouseout="this.style.background='rgba(59,130,246,0.1)'; this.style.color='var(--accent)';" onclick="App.viewTaskDetail('${t.id}')" title="Xem chi tiết"></i>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border); padding-top: 10px;">
                    <div style="font-size: 11px; color: var(--text-light);">Giao bởi: <b>${t.nguoiGiao}</b> ➔ <b>${t.nguoiNhan}</b><br><span style="color:${statusColor}; font-weight:800; display:inline-block; margin-top:4px;">${t.trangThai.toUpperCase()}</span></div>
                    <div style="text-align: right;"><span style="font-size:10px; color:var(--text-light); display:block; margin-bottom:4px;">Tạo: ${t.ngayGiao}</span><span style="font-size:11px; color:var(--danger); font-weight:800;">Hạn: ${t.thoiHan}</span></div>
                  </div>
              </div>
            </div>`;
        });
        
        safeSet('allTasksContainer', h || '<div style="text-align:center; padding: 20px; font-style:italic; color: var(--text-light);">Không tìm thấy nhiệm vụ nào.</div>', 'html');
        this.toggleBulkActionButton(); 
    },

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

    confirmCompleteMultipleTasks() {
        let checkedBoxes = document.querySelectorAll('.task-multi-check:checked');
        if (checkedBoxes.length === 0) return;
        
        let idsToComplete = Array.from(checkedBoxes).map(cb => cb.value);

        Swal.fire({
          title: 'Xác nhận hoàn thành?',
          text: `Bạn sắp đánh dấu XONG ${idsToComplete.length} nhiệm vụ đã chọn.`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#10b981', 
          cancelButtonColor: '#ef4444', 
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
                  
                  let msg = `✅ <b>NGHIỆM THU NHIỆM VỤ</b>\n`;
                  msg += `👤 Nhân sự: <b>${this.user}</b>\n`;
                  msg += `🎉 Vừa đánh dấu HOÀN THÀNH ${idsToComplete.length} nhiệm vụ từ Kho.`;
                  
                  if (typeof this.sendTelegram === 'function') {
                      this.sendTelegram(msg);
                  }

                  this.showPopup(`Tuyệt vời! Đã nghiệm thu ${idsToComplete.length} nhiệm vụ.`, true);
                  this.loadAllTasks(); 
              } catch (err) {
                  this.showPopup("Lỗi hệ thống: " + err.message, false);
              } finally {
                  this.hideL();
              }
          }
        });
    },

    viewTaskDetail(id) {
        let task = this.allTasksList.find(t => String(t.id) === String(id));
        if (task) {
            safeSet('taskDetailContent', task.noiDung);
            const modal = document.getElementById('taskDetailPopup');
            if (modal) {
                modal.style.setProperty('display', 'flex', 'important');
                setTimeout(() => modal.classList.add('active'), 10);
            }
        }
    },
    
    closeTaskDetail(e) {
        if (e && e.target && e.target.id !== 'taskDetailPopup') return; 
        const modal = document.getElementById('taskDetailPopup');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.style.setProperty('display', 'none', 'important'), 300);
        }
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
          div.className = 'assign-block-item'; 
          div.style.cssText = "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 15px -5px rgba(0,0,0,0.05); border-top: 5px solid var(--accent); transition: all 0.3s ease;";
          
          div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #cbd5e1;">
                <span style="font-size:12px; font-weight:800; color:var(--primary); text-transform: uppercase;">
                    <i class="fa-solid fa-thumbtack" style="color:var(--accent); margin-right: 6px;"></i> Nhiệm vụ mới
                </span>
                <i class="fa-solid fa-trash" style="color:var(--danger); cursor:pointer; font-size: 16px; padding: 5px; transition: 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" onclick="this.closest('.assign-block-item').remove()" title="Xóa block này"></i>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; margin-bottom: 15px;">
                <div>
                    <label style="font-size: 11px; font-weight: 800; color: var(--text-light); margin-bottom: 6px; display: block;">NGƯỜI GIAO</label>
                    <select class="form-control assign-giver" style="padding:12px; font-size:13px; background-color: #f8fafc; border-color: #cbd5e1;">
                        ${giverOpts}
                    </select>
                </div>
                <div>
                    <label style="font-size: 11px; font-weight: 800; color: var(--text-light); margin-bottom: 6px; display: block;">NGƯỜI NHẬN</label>
                    <select class="form-control assign-receiver" style="padding:12px; font-size:13px; border-color: #cbd5e1;">
                        ${receiverOpts}
                    </select>
                </div>
                <div>
                    <label style="font-size: 11px; font-weight: 800; color: var(--text-light); margin-bottom: 6px; display: block;">THỜI HẠN (DEADLINE)</label>
                    <input type="date" class="form-control assign-date" value="${todayStr}" style="padding:12px; font-size:13px; border-color: #cbd5e1;">
                </div>
            </div>
            
            <div>
                <label style="font-size: 11px; font-weight: 800; color: var(--text-light); margin-bottom: 6px; display: block;">NỘI DUNG CÔNG VIỆC</label>
                <textarea class="form-control assign-content" rows="3" placeholder="Mô tả chi tiết nhiệm vụ cần thực hiện..." style="padding:12px; font-size:13px; border-color: #cbd5e1; resize: vertical;"></textarea>
            </div>
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
          const con = block.querySelector('.assign-content').value.trim();
          
          // ĐÃ THÊM LOGIC TÀNG HÌNH: Trống cả người nhận và nội dung -> Hệ thống tự động lờ đi (không báo lỗi)
          if (!rec && !con) return;
          
          // Trống 1 trong 2 -> Báo lỗi để tránh gửi lên Supabase bị khuyết dữ liệu
          if(rec && giver && con) { 
              tasksToAssign.push({ giver: giver, receiver: rec, deadline: date || null, content: con, status: 'Chưa hoàn thành' }); 
          } else { 
              hasError = true; 
          }
        });
        
        if(hasError) { alert("Lỗi: Có nhiệm vụ bị điền thiếu thông tin (chưa nhập nội dung hoặc chưa chọn người nhận)!"); return; }
        if(tasksToAssign.length === 0) { alert("Vui lòng điền đầy đủ nội dung và người thực hiện cho ít nhất 1 nhiệm vụ!"); return; }
        
        this.showL();
        try {
            const { error } = await supabaseClient.from('data_tasks').insert(tasksToAssign);
            if(error) throw error;

            let msg = `📌 <b>PHÁT HÀNH NHIỆM VỤ MỚI</b>\n`;
            msg += `👤 Người giao: <b>${this.user}</b>\n`;
            msg += `📋 Số lượng: ${tasksToAssign.length} nhiệm vụ\n`;
            tasksToAssign.forEach((t, i) => {
                let shortCon = t.content.length > 50 ? t.content.substring(0, 50) + "..." : t.content;
                msg += `\n${i+1}. Giao cho <b>${t.receiver}</b> (Hạn: ${t.deadline || 'Không'}):\n👉 ${shortCon}`;
            });
            
            if (typeof this.sendTelegram === 'function') {
                this.sendTelegram(msg);
            }

            this.showPopup("Phát hành thành công " + tasksToAssign.length + " nhiệm vụ!", true); 
            this.nav('page-task-list'); 
        } catch(error) {
            this.showPopup("Lỗi phát hành: " + error.message, false);
        } finally {
            this.hideL();
        }
    }
});
