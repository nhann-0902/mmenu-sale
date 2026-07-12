Object.assign(window.App, {
    calcRev() { 
        let pmEl = document.getElementById('r_pm');
        let pcEl = document.getElementById('r_pc');
        let otEl = document.getElementById('r_ot');
        let paidEl = document.getElementById('r_paid');
        
        let pm = pmEl ? Number(pmEl.value) : 0; 
        let pc = pcEl ? Number(pcEl.value) : 0; 
        let ot = otEl ? Number(otEl.value) : 0;
        let total = pm + pc + ot; 
        let paid = paidEl ? Number(paidEl.value) : 0; 
        
        let debt = total - paid;
        
        safeSet('displayTotal', this.fmtFull(total));
        
        let debtStr = this.fmtFull(debt);
        const debtEl = document.getElementById('displayDebt');
        if (debtEl) {
            if (debt > 0) {
                debtStr = "+" + debtStr; 
                debtEl.style.color = 'var(--danger)'; 
            } else if (debt < 0) {
                debtEl.style.color = 'var(--warning)'; 
            } else {
                debtEl.style.color = 'var(--success)'; 
            }
        }
        safeSet('displayDebt', debtStr);
        
        return { total, debt, paid, pm, pc, ot };
    },

    renderRevConfirm() { 
        let c = this.calcRev();
        let nameEl = document.getElementById('r_name');
        let dateEl = document.getElementById('r_date');
        let typeEl = document.getElementById('r_type');
        
        let name = (nameEl && nameEl.value) ? nameEl.value : '<span style="color:var(--danger)">[CHƯA NHẬP TÊN]</span>'; 
        let date = dateEl ? dateEl.value : ''; 
        let type = (typeEl && typeEl.value) ? typeEl.value : 'Không phân loại'; 
        
        let debtColor = c.debt > 0 ? 'var(--danger)' : (c.debt < 0 ? 'var(--warning)' : 'var(--success)');
        
        // ĐÃ XÓA: Chữ (Âm/Dương) ở đoạn htmlStr bên dưới
        let htmlStr = ` 
          <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--border); padding:6px 0;"><span style="color:var(--text-light);">Ngày GD:</span> <b>${date}</b></div> 
          <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--border); padding:6px 0;"><span style="color:var(--text-light);">Tên khách/đối tác:</span> <b style="color:var(--primary); text-transform:uppercase;">${name}</b></div> 
          <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--border); padding:6px 0;"><span style="color:var(--text-light);">Loại Hợp đồng:</span> <b>${type}</b></div> 
          <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--border); padding:6px 0; margin-top: 10px;"><span style="color:var(--text-light);">Tổng HĐ:</span> <b style="color:var(--accent); font-size:14px;">${this.fmtFull(c.total)}</b></div> 
          <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--border); padding:6px 0;"><span style="color:var(--text-light);">Đã thanh toán:</span> <b style="color:var(--success); font-size:14px;">${this.fmtFull(c.paid)}</b></div> 
          <div style="display:flex; justify-content:space-between; padding:6px 0; margin-top: 10px;"><span style="font-weight:800; color:${debtColor};">Công nợ:</span> <b style="color:${debtColor}; font-size:14px;">${this.fmtFull(c.debt)}</b></div> 
        `; 
        safeSet('revConfirmStats', htmlStr, 'html');
    },

    async submitRevenue() { 
        let c = this.calcRev(); 
        let dateEl = document.getElementById('r_date');
        let srcEl = document.getElementById('r_src');
        let typeEl = document.getElementById('r_type');
        let nameEl = document.getElementById('r_name');
        
        let p = {
          date: dateEl ? dateEl.value : '', 
          userFullName: this.user,
          source: srcEl ? srcEl.value : '', 
          type: typeEl ? typeEl.value : '',
          name: nameEl ? nameEl.value : '', 
          pm: c.pm, pc: c.pc, ot: c.ot, total: c.total, paid: c.paid, debt: c.debt
        };

        if (!p.name.trim()) { alert("Vui lòng điền tên Đối tác/Nhà hàng!"); return; } 
        if (p.total <= 0) { alert("Tổng hợp đồng phải lớn hơn 0!"); return; } 
        
        this.showL(); 
        try {
            const { error } = await supabaseClient.from('data_revenue').insert([{
                transaction_date: p.date, staff_name: p.userFullName, source: p.source, contract_type: p.type, customer_name: p.name,
                rev_software: p.pm, rev_hardware: p.pc, rev_other: p.ot, total_contract: p.total, paid_amount: p.paid, debt_amount: p.debt
            }]);
            if(error) throw error;

            let msg = `💰 <b>DOANH THU MỚI</b>\n`;
            msg += `👤 Nhân sự: <b>${p.userFullName}</b>\n`;
            msg += `🤝 Khách hàng: <b>${p.name}</b>\n`;
            msg += `🏷️ Phân loại: ${p.type} | Nguồn: ${p.source}\n`;
            msg += `💵 Tổng hợp đồng: <b>${this.fmtFull(p.total)}</b>\n`;
            msg += `✅ Đã thanh toán: ${this.fmtFull(p.paid)}\n`;
            msg += `⚠️ Công nợ: ${this.fmtFull(p.debt)}`;
            
            if (typeof this.sendTelegram === 'function') {
                this.sendTelegram(msg);
            }

            document.querySelectorAll('.rev-input').forEach(el => { 
              if (el.type === 'number' || el.type === 'text') el.value = ''; 
              else if (el.tagName === 'SELECT') el.selectedIndex = 0;
            }); 
            this.calcRev(); 
            this.showPopup("Giao dịch đã được ghi nhận vào hệ thống!", true); 
            this.nav('page-launchpad'); 
        } catch(error) {
            this.showPopup("Lỗi lưu doanh thu: " + error.message, false);
        } finally {
            this.hideL();
        }
    }
});
