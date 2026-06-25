// MODULE 4: BÁO CÁO NGÀY
Object.assign(window.App, {
    tasks: [],

    async loadDailyTasks() { 
        this.showL();
        try {
            // Chỉ kéo task của user đang đăng nhập và chưa hoàn thành
            const { data, error } = await supabaseClient.from('data_tasks').select('*')
                .eq('receiver', this.user)
                .eq('status', 'Chưa hoàn thành')
                .order('deadline', { ascending: true });
                
            if(error) throw error;

            this.tasks = data.map(t => {
                let rawTime = t.deadline ? new Date(t.deadline).getTime() : 0;
                let isOverdue = (rawTime > 0 && rawTime < new Date().getTime());
                // Sử dụng formatDateStr từ core.js
                let formattedDate = t.deadline ? new Date(t.deadline).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'}) : '-';
                return {
                    id: t.id, nguoiGiao: t.giver, noiDung: t.content, 
                    thoiHan: formattedDate, isOverdue: isOverdue
                };
            });

            let html = ''; 
            this.tasks.forEach(task => { 
                let alertClass = task.isOverdue ? "task-alert-overdue" : "task-normal"; 
                let colorDead = task.isOverdue ? "var(--danger)" : "var(--text-light)"; 
                html += `
                  <div class="card task-item ${alertClass}" style="padding: 12px; margin-bottom: 10px;">
                    <div class="task-content" data-text="${task.noiDung}" style="font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 8px;">
                      <span style="color:var(--accent);">[${task.nguoiGiao}]</span> ${task.noiDung}
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px dashed var(--border); padding-top: 8px;">
                      <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                        <input type="checkbox" class="task-check" value="${task.id}" style="width:16px; height:16px; accent-color: var(--success);">
                        <span style="font-size:10px; font-weight:800; color:var(--success);">TÍCH XONG</span>
                      </label>
                      <div style="font-size:10px; font-weight:700; color:${colorDead};">Hạn: ${task.thoiHan}</div>
                    </div>
                  </div>`; 
            }); 
            document.getElementById('dailyTaskList').innerHTML = html || '<div style="text-align:center; font-style:italic; font-size:12px; color:var(--text-light);">Bạn đã dọn dẹp sạch sẽ task cá nhân!</div>'; 
        } catch(error) {
            console.error(error);
        } finally {
            this.hideL();
        }
    },

    renderDailyConfirm() { 
        const ids = ['d_tong','d_nhan','d_tu','d_tn','d_dm','d_bg','d_tc']; 
        const labels = ['Tổng Lead','Lead nhận','Tự tìm','Tiềm năng','Demo/gặp gỡ','Báo giá','Từ chối']; 
        
        let htmlStats = ''; 
        ids.forEach((id, idx) => { 
          let val = document.getElementById(id).value || 0; 
          htmlStats += `<div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--border); padding:6px 0;"><span style="color:var(--text-light);">${labels[idx]}</span> <b style="color:var(--primary)">${val}</b></div>`; 
        }); 
        document.getElementById('dailyConfirmStats').innerHTML = htmlStats; 
        
        let taskHtml = ''; let countDone = 0; 
        document.querySelectorAll('.task-item').forEach(item => { 
          const cb = item.querySelector('.task-check'); 
          if(cb && cb.checked) { 
            countDone++;
            let content = item.querySelector('.task-content').getAttribute('data-text'); 
            taskHtml += `<div style="background: rgba(16, 185, 129, 0.1); border-left: 3px solid var(--success); padding: 10px; border-radius: 8px; margin-bottom: 8px; font-size:11px; color: var(--primary);"><b>✓</b> ${content}</div>`;
          } 
        });
        if(countDone === 0) taskHtml = `<div style="text-align:center; font-size:11px; color:var(--text-light); font-style:italic;">Bạn chưa hoàn thành nhiệm vụ nào.</div>`; 
        document.getElementById('dailyConfirmTasksList').innerHTML = taskHtml;
    },

    async submitDaily() { 
        let p = {
          date: document.getElementById('d_date').value,
          userFullName: this.user,
          tong: document.getElementById('d_tong').value || 0, 
          nhan: document.getElementById('d_nhan').value || 0,
          tu: document.getElementById('d_tu').value || 0, 
          tn: document.getElementById('d_tn').value || 0,
          dm: document.getElementById('d_dm').value || 0, 
          bg: document.getElementById('d_bg').value || 0,
          tc: document.getElementById('d_tc').value || 0, 
          completedTaskIds: [], 
          taskNotes: ""
        };

        document.querySelectorAll('.task-item').forEach(item => {
           const cb = item.querySelector('.task-check');
           if(cb && cb.checked) {
               p.completedTaskIds.push(cb.value); 
               p.taskNotes += "Xong: " + item.querySelector('.task-content').getAttribute('data-text') + " | ";
           }
        });

        this.showL(); 
        try {
            // 1. Lưu Lead vào data_leads
            const { error: err1 } = await supabaseClient.from('data_leads').insert([{
                date: p.date, staff_name: p.userFullName, total_lead: p.tong, lead_nhan: p.nhan, lead_tu: p.tu, 
                tiem_nang: p.tn, demo_gap: p.dm, bao_gia: p.bg, tu_choi: p.tc, task_notes: p.taskNotes
            }]);
            if(err1) throw err1;

            // 2. Cập nhật trạng thái Task thành Hoàn thành
            if(p.completedTaskIds.length > 0) {
                const { error: err2 } = await supabaseClient.from('data_tasks')
                    .update({ status: 'Hoàn thành', updated_at: new Date().toISOString() }).in('id', p.completedTaskIds);
                if(err2) throw err2;
            }

            document.querySelectorAll('.daily-input').forEach(el => el.value = ''); 
            this.showPopup("Báo cáo ngày đã được niêm phong!", true); 
            this.nav('page-launchpad'); 
        } catch(error) {
            console.error(error);
            this.showPopup("Lỗi lưu báo cáo: " + error.message, false);
        } finally {
            this.hideL();
        }
    }
});
