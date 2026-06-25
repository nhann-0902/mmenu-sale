Object.assign(window.App, {
    tasks: [],

    async loadDailyTasks() { 
        this.showL();
        try {
            const { data, error } = await supabaseClient.from('data_tasks').select('*')
                .eq('receiver', this.user)
                .eq('status', 'Chưa hoàn thành')
                .order('deadline', { ascending: true });
            if(error) throw error;

            this.tasks = (data || []).map(t => {
                let rawTime = t.deadline ? new Date(t.deadline).getTime() : 0;
                let isOverdue = (rawTime > 0 && rawTime < new Date().getTime());
                let formattedDate = t.deadline ? new Date(t.deadline).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'}) : '-';
                return { id: t.id, nguoiGiao: t.giver, noiDung: t.content, thoiHan: formattedDate, isOverdue: isOverdue };
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
                      <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" class="task-check" value="${task.id}" style="width:16px; height:16px; accent-color: var(--success);"><span style="font-size:10px; font-weight:800; color:var(--success);">TÍCH XONG</span></label>
                      <div style="font-size:10px; font-weight:700; color:${colorDead};">Hạn: ${task.thoiHan}</div>
                    </div>
                  </div>`; 
            }); 
            
            safeSet('dailyTaskList', html || '<div style="text-align:center; font-style:italic; font-size:12px; color:var(--text-light);">Bạn đã dọn dẹp sạch sẽ task cá nhân!</div>', 'html'); 
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
          const el = document.getElementById(id);
          let val = el ? el.value : 0; 
          htmlStats += `<div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--border); padding:6px 0;"><span style="color:var(--text-light);">${labels[idx]}</span> <b style="color:var(--primary)">${val}</b></div>`; 
        }); 
        safeSet('dailyConfirmStats', htmlStats, 'html'); 
        
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
        safeSet('dailyConfirmTasksList', taskHtml, 'html');
    },

    async submitDaily() { 
        let d_date = document.getElementById('d_date');
        let d_tong = document.getElementById('d_tong');
        let d_nhan = document.getElementById('d_nhan');
        let d_tu = document.getElementById('d_tu');
        let d_tn = document.getElementById('d_tn');
        let d_dm = document.getElementById('d_dm');
        let d_bg = document.getElementById('d_bg');
        let d_tc = document.getElementById('d_tc');
        
        let p = {
          date: d_date ? d_date.value : '',
          userFullName: this.user,
          tong: d_tong ? d_tong.value : 0, 
          nhan: d_nhan ? d_nhan.value : 0,
          tu: d_tu ? d_tu.value : 0, 
          tn: d_tn ? d_tn.value : 0,
          dm: d_dm ? d_dm.value : 0, 
          bg: d_bg ? d_bg.value : 0,
          tc: d_tc ? d_tc.value : 0, 
          completedTaskIds: [], 
          taskNotes: "",
          completedTaskDetails: [] 
        };

        document.querySelectorAll('.task-item').forEach(item => {
           const cb = item.querySelector('.task-check');
           if(cb && cb.checked) {
               p.completedTaskIds.push(cb.value); 
               let txt = item.querySelector('.task-content').getAttribute('data-text');
               p.taskNotes += "Xong: " + txt + " | ";
               p.completedTaskDetails.push(txt); 
           }
        });

        this.showL(); 
        try {
            const { error: err1 } = await supabaseClient.from('data_leads').insert([{
                date: p.date, staff_name: p.userFullName, total_lead: p.tong, lead_nhan: p.nhan, lead_tu: p.tu, 
                tiem_nang: p.tn, demo_gap: p.dm, bao_gia: p.bg, tu_choi: p.tc, task_notes: p.taskNotes
            }]);
            if(err1) throw err1;

            if(p.completedTaskIds.length > 0) {
                const { error: err2 } = await supabaseClient.from('data_tasks')
                    .update({ status: 'Hoàn thành', updated_at: new Date().toISOString() }).in('id', p.completedTaskIds);
                if(err2) throw err2;
            }

            // Đổi định dạng ngày YYYY-MM-DD sang DD-MM-YYYY
            let dateParts = p.date.split('-'); 
            let displayDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : p.date;

            // KHỐI TIN NHẮN CHUẨN FORM TELEGRAM (Có icon 🚨 nhấp nháy trước Báo Cáo Ngày)
            let msg = `<b>🚨 BÁO CÁO ${displayDate}</b>\n`;
            msg += `*****************************\n`;
            msg += `Tên: ${p.userFullName}\n`;
            msg += `*****************************\n`;
            msg += `<b><i>-Report lead</i></b>\n`;
            msg += `<i>Total lead:</i> ${p.tong}\n`;
            msg += `<i>Lead nhận:</i> ${p.nhan}\n`;
            msg += `<i>Tự tìm:</i> ${p.tu}\n`;
            msg += `<i>Tiềm năng:</i> ${p.tn}\n`;
            msg += `<i>Demo/gặp:</i> ${p.dm}\n`;
            msg += `<i>Báo giá:</i> ${p.bg}\n`;
            msg += `<i>Từ chối:</i> ${p.tc}\n`;
            msg += `*****************************\n`;
            msg += `<b><i>-Task done</i></b>\n`;

            if (p.completedTaskDetails.length > 0) {
                p.completedTaskDetails.forEach((txt, idx) => {
                    let taskNum = (idx + 1).toString().padStart(2, '0');
                    // In nghiêng nguyên khối Task
                    msg += `<i>Task ${taskNum}: ${txt}\n         ${p.date}</i>\n`;
                });
            } else {
                msg += `<i>(Không có nhiệm vụ hoàn thành)</i>`;
            }

            // Gửi Telegram
            if (typeof this.sendTelegram === 'function') {
                this.sendTelegram(msg);
            }

            document.querySelectorAll('.daily-input').forEach(el => el.value = ''); 
            this.showPopup("Báo cáo ngày đã được niêm phong!", true); 
            this.nav('page-launchpad'); 
        } catch(error) {
            this.showPopup("Lỗi lưu báo cáo: " + error.message, false);
        } finally {
            this.hideL();
        }
    }
});
