Object.assign(window.App, {
    calcRev() { 
        let pm = document.getElementById('r_pm') ? Number(document.getElementById('r_pm').value) : 0; 
        let pc = document.getElementById('r_pc') ? Number(document.getElementById('r_pc').value) : 0; 
        let ot = document.getElementById('r_ot') ? Number(document.getElementById('r_ot').value) : 0;
        let total = pm + pc + ot; 
        let paid = document.getElementById('r_paid') ? Number(document.getElementById('r_paid').value) : 0; 
        let debt = total - paid;
        
        if(document.getElementById('displayTotal')) document.getElementById('displayTotal').innerText = this.fmtFull(total); 
        if(document.getElementById('displayDebt')) document.getElementById('displayDebt').innerText = this.fmtFull(debt); 
        
        let debtSec = document.getElementById('debtSection'); 
        if(debtSec) {
            if (debt > 0) { debtSec.style.display = 'block'; } else { debtSec.style.display = 'none'; } 
        }
        return { total, debt, paid, pm, pc, ot };
    },

    renderRevConfirm() { 
        let c = this.calcRev();
        let name = (document.getElementById('r_name') && document.getElementById('r_name').value) ? document.getElementById('r_name').value : '<span style="color:var(--danger)">[CHƯA NHẬP TÊN]</span>'; 
        let date = document.getElementById('r_date') ? document.getElementById('r_date').value : ''; 
        let type = (document.getElementById('r_type') && document.getElementById('r_type').value) ? document.getElementById('r_type').value : 'Không phân loại'; 
        
        let container = document.getElementById('revConfirmStats');
        if(container) {
            container.innerHTML = ` 
              <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--border); padding:6px 0;"><span style="color:var(--text-light);">Ngày GD:</span> <b>${date}</b></div> 
              <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--border); padding:6px 0;"><span style="color:var(--text-light);">Tên khách/đối tác:</span> <b style="color:var(--primary); text-transform:uppercase;">${name}</b></div> 
              <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--border); padding:6px 0;"><span style="color:var(--text-light);">Loại Hợp đồng:</span> <b>${type}</b></div> 
              <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--border); padding:6px 0; margin-top: 10px;"><span style="color:var(--text-light);">Tổng HĐ:</span> <b style="color:var(--accent); font-size:14px;">${this.fmtFull(c.total)}</b></div> 
              <div style="display:flex; justify-content:space-between; border-bottom:1px dashed var(--border); padding:6px 0;"><span style="color:var(--text-light);">Đã thanh toán:</span> <b style="color:var(--success); font-size:14px;">${this.fmtFull(c.paid)}</b></div> 
              <div style="display:flex; justify-content:space-between; padding:6px 0; margin-top: 10px;"><span style="color:var(--danger); font-weight:800;">Công nợ còn lại:</span> <b style="color:var(--danger); font-size:14px;">${this.fmtFull(c.debt)}</b></div> 
            `; 
        }
    },

    async submitRevenue() { 
        let c = this.calcRev(); 
        let p = {
          date: document.getElementById('r_date').value, 
          userFullName: this.user,
          source: document.getElementById('r_src').value, 
          type: document.getElementById('r_type').value,
          name: document.getElementById('r_name').value, 
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
