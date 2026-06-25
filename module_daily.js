async submitDaily() { 
        let d_date = document.getElementById('d_date');
        let d_tong = document.getElementById('d_tong');
        let d_nhan = document.getElementById('d_nhan');
        let d_tu = document.getElementById('d_tu');
        let d_tn = document.getElementById('d_tn');
        let d_dm = document.getElementById('d_dm');
        let d_bg = document.getElementById('d_bg');
        let d_tc = document.getElementById('d_tc');
        
        // Hàm phụ để chặn lỗi ký tự đặc biệt gây crash Telegram
        const escapeHtml = (str) => String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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

            let dateParts = p.date.split('-'); 
            let displayDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : p.date;

            // Xây dựng tin nhắn theo đúng định dạng bạn yêu cầu
            let msg = `<b>🚨 BÁO CÁO NGÀY ${displayDate}</b>\n`;
            msg += `*****************************\n`;
            msg += `Tên: ${p.userFullName}\n`;
            msg += `*****************************\n`;
            msg += `<b><i>-Report lead</i></b>\n`;
            msg += `<b>Total lead:</b> ${p.tong}\n`;
            msg += `<b>Lead nhận:</b> ${p.nhan}\n`;
            msg += `<b>Tự tìm:</b> ${p.tu}\n`;
            msg += `<b>Tiềm năng:</b> ${p.tn}\n`;
            msg += `<b>Demo/gặp:</b> ${p.dm}\n`;
            msg += `<b>Báo giá:</b> ${p.bg}\n`;
            msg += `<b>Từ chối:</b> ${p.tc}\n`;
            msg += `*****************************\n`;
            msg += `<b><i>-Task done</i></b>\n`;

            if (p.completedTaskDetails.length > 0) {
                p.completedTaskDetails.forEach((txt, idx) => {
                    let taskNum = (idx + 1).toString().padStart(2, '0');
                    // In nghiêng nội dung task và ngày
                    msg += `<i>Task ${taskNum}: ${escapeHtml(txt)}\n         ${p.date}</i>\n`;
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
