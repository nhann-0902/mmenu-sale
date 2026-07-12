Object.assign(window.App, {
    async loadDashboards() { 
        if (typeof Chart === 'undefined') return;
        this.showL();
        
        const filterStaffEl = document.getElementById('dashFilterStaff');
        if (filterStaffEl && filterStaffEl.options.length <= 1) {
            let staffList = await (this.getDbStaffList ? this.getDbStaffList() : Promise.resolve(this.staffList));
            let currentVal = filterStaffEl.value;
            safeSet('dashFilterStaff', `<option value="ALL">Tất cả nhân sự</option>` + staffList.map(x => `<option value="${x}">${x}</option>`).join(''), 'html');
            filterStaffEl.value = currentVal;
        }

        let filterTime = document.getElementById('dashFilterTime') ? document.getElementById('dashFilterTime').value : 'ALL';
        let filterStaff = filterStaffEl ? filterStaffEl.value : 'ALL';

        let startDate = null;
        let endDate = null;
        let tempD = new Date();
        tempD.setHours(0,0,0,0);

        // LOGIC LỌC THỜI GIAN
        if (filterTime === 'TODAY') {
            startDate = new Date(tempD); endDate = new Date(tempD);
        } else if (filterTime === 'YESTERDAY') {
            startDate = new Date(tempD); startDate.setDate(startDate.getDate() - 1);
            endDate = new Date(startDate);
        } else if (filterTime === 'THIS_WEEK') {
            let day = tempD.getDay();
            let diff = tempD.getDate() - day + (day === 0 ? -6 : 1);
            startDate = new Date(tempD.setDate(diff));
            endDate = new Date();
        } else if (filterTime === 'LAST_WEEK') {
            let day = tempD.getDay();
            let diff = tempD.getDate() - day + (day === 0 ? -6 : 1) - 7;
            startDate = new Date(tempD.setDate(diff));
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);
        } else if (filterTime === 'THIS_MONTH') {
            startDate = new Date(tempD.getFullYear(), tempD.getMonth(), 1);
            endDate = new Date(tempD.getFullYear(), tempD.getMonth() + 1, 0);
        } else if (filterTime === 'LAST_MONTH') {
            startDate = new Date(tempD.getFullYear(), tempD.getMonth() - 1, 1);
            endDate = new Date(tempD.getFullYear(), tempD.getMonth(), 0);
        } else if (filterTime === 'LAST_7_DAYS') {
            startDate = new Date(tempD); startDate.setDate(startDate.getDate() - 6);
            endDate = new Date();
        } else if (filterTime === 'LAST_30_DAYS') {
            startDate = new Date(tempD); startDate.setDate(startDate.getDate() - 29);
            endDate = new Date();
        } else if (filterTime === 'THIS_YEAR') {
            startDate = new Date(tempD.getFullYear(), 0, 1);
            endDate = new Date(tempD.getFullYear(), 11, 31);
        }

        let formatISO = (d) => { let z = d.getTimezoneOffset() * 60000; return new Date(d - z).toISOString().split('T')[0]; };

        try {
            let qRev = supabaseClient.from('data_revenue').select('*');
            let qLead = supabaseClient.from('data_leads').select('*');
            let qTask = supabaseClient.from('data_tasks').select('*');

            if (startDate && endDate) {
                let sStr = formatISO(startDate);
                let eStr = formatISO(endDate);
                qRev = qRev.gte('transaction_date', sStr).lte('transaction_date', eStr);
                qLead = qLead.gte('date', sStr).lte('date', eStr);
                qTask = qTask.gte('created_at', sStr + 'T00:00:00').lte('created_at', eStr + 'T23:59:59');
            }

            if (filterStaff !== 'ALL') {
                qRev = qRev.eq('staff_name', filterStaff);
                qLead = qLead.eq('staff_name', filterStaff);
                qTask = qTask.eq('receiver', filterStaff);
            }

            const [revRes, leadRes, taskRes] = await Promise.all([qRev, qLead, qTask]);
            
            let dash = {
              kpi: { actual: 0, target: 1000000000 }, 
              rev: { sw: 0, hw: 0, ot: 0, paid: 0, debt: 0 },
              trendDays: [], revTrend: [], debtTrend: [], leadTrend: [],
              lead: { nhan: 0, lh: 0, tn: 0, bg: 0, dm: 0, tc: 0 },
              source: {}, staffRank: {}, task: { done: 0, pending: 0 }
            };

            let tempTrends = {};

            (revRes.data || []).forEach(r => {
                dash.rev.sw += Number(r.rev_software) || 0;
                dash.rev.hw += Number(r.rev_hardware) || 0;
                dash.rev.ot += Number(r.rev_other) || 0;
                let vTotal = Number(r.total_contract) || 0;
                let vPaid = Number(r.paid_amount) || 0;
                let vDebt = Number(r.debt_amount) || 0;
                dash.rev.paid += vPaid;
                dash.rev.debt += vDebt;
                dash.kpi.actual += vTotal;

                let src = String(r.source).trim() || "Khác";
                dash.source[src] = (dash.source[src] || 0) + 1;
                
                let staff = String(r.staff_name).trim() || "N/A";
                dash.staffRank[staff] = (dash.staffRank[staff] || 0) + (vTotal / 1000000); 

                let dKey = r.transaction_date ? new Date(r.transaction_date).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'}) : '-';
                if (!tempTrends[dKey]) tempTrends[dKey] = { r: 0, d: 0, l: 0 };
                tempTrends[dKey].r += (vTotal / 1000000);
                tempTrends[dKey].d += (vDebt / 1000000);
            });

            (leadRes.data || []).forEach(l => {
                let vNhan = Number(l.lead_nhan) || 0; 
                let vTu = Number(l.lead_tu) || 0;   
                dash.lead.nhan += (vNhan + vTu);
                dash.lead.lh += Number(l.total_lead) || 0; 
                dash.lead.tn += Number(l.tiem_nang) || 0; 
                dash.lead.bg += Number(l.bao_gia) || 0; 
                dash.lead.dm += Number(l.demo_gap) || 0;
                dash.lead.tc += Number(l.tu_choi) || 0; 

                let dKey = l.date ? new Date(l.date).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'}) : '-';
                if (!tempTrends[dKey]) tempTrends[dKey] = { r: 0, d: 0, l: 0 };
                tempTrends[dKey].l = (tempTrends[dKey].l || 0) + (Number(l.total_lead) || 0);
            });

            let sortedDates = Object.keys(tempTrends).sort().slice(-7);
            sortedDates.forEach(k => {
                dash.trendDays.push(k);
                dash.revTrend.push(tempTrends[k].r);
                dash.debtTrend.push(tempTrends[k].d);
                dash.leadTrend.push(tempTrends[k].l || 0); 
            });

            (taskRes.data || []).forEach(t => {
                if (String(t.status).toLowerCase() === "hoàn thành") dash.task.done++;
                else dash.task.pending++;
            });

            safeSet('kpiActualNum', this.fmt(dash.kpi.actual)); 
            safeSet('kpiTargetNum', "Target: " + this.fmt(dash.kpi.target)); 
            let pct = dash.kpi.target > 0 ? Math.round((dash.kpi.actual / dash.kpi.target) * 100) : 0; 
            safeSet('kpiPercentNum', pct + "%"); 
            setTimeout(() => { safeStyle('kpiProgressBar', 'width', Math.min(pct, 100) + "%"); }, 200); 
            
            this.chartInstances = this.chartInstances || {};
            Object.values(this.chartInstances).forEach(chart => { if(chart) chart.destroy(); }); 
            this.chartInstances = {}; 
             
            let canvasTrendRev = document.getElementById('chartTrendRev');
            if (canvasTrendRev) {
                let ctxRev = canvasTrendRev.getContext('2d');
                let gradRev = ctxRev.createLinearGradient(0, 0, 0, 300); 
                gradRev.addColorStop(0, 'rgba(59, 130, 246, 0.4)'); 
                gradRev.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
                this.chartInstances.c1 = new Chart(ctxRev, { 
                  type: 'line', 
                  data: { labels: dash.trendDays.length ? dash.trendDays : ['Chưa có data'], datasets: [ { label: 'Doanh thu (Tr)', data: dash.revTrend, borderColor: '#3b82f6', tension: 0.4, fill: true, backgroundColor: gradRev, pointBackgroundColor: '#fff', pointRadius: 4, order: 1 }, { type: 'bar', label: 'Công nợ (Tr)', data: dash.debtTrend, backgroundColor: '#ef4444', borderRadius: 4, order: 2 } ] }, 
                  options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'top' } } } 
                });
            }

            if(document.getElementById('chartProduct')) this.chartInstances.c2 = new Chart(document.getElementById('chartProduct'), { type: 'bar', data: { labels: ['PM', 'PC', 'Khác'], datasets: [{ data: [dash.rev.sw, dash.rev.hw, dash.rev.ot], backgroundColor: ['#0f172a', '#3b82f6', '#94a3b8'], borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { display: false } } } });
            if(document.getElementById('chartDebt')) this.chartInstances.c3 = new Chart(document.getElementById('chartDebt'), { type: 'doughnut', data: { labels: ['Đã thanh toán', 'Công nợ'], datasets: [{ data: [dash.rev.paid, dash.rev.debt], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom' } } } });
            if(document.getElementById('chartLeadStatus')) this.chartInstances.c4 = new Chart(document.getElementById('chartLeadStatus'), { type: 'doughnut', data: { labels: ['LH Được', 'Tiềm năng', 'Báo giá', 'Từ chối'], datasets: [{ data: [dash.lead.lh, dash.lead.tn, dash.lead.bg, dash.lead.tc], backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } } });
            if(document.getElementById('chartLeadTrend')) this.chartInstances.c5 = new Chart(document.getElementById('chartLeadTrend'), { type: 'line', data: { labels: dash.trendDays.length ? dash.trendDays : ['Chưa có data'], datasets: [{ label: 'Lead Mới', data: dash.leadTrend, borderColor: '#10b981', tension: 0.4, borderWidth: 3, pointBackgroundColor: '#fff' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } } });
            
            let srcLabels = Object.keys(dash.source);
            if(document.getElementById('chartSource')) this.chartInstances.c6 = new Chart(document.getElementById('chartSource'), { type: 'pie', data: { labels: srcLabels.length ? srcLabels : ['Trống'], datasets: [{ data: srcLabels.length ? Object.values(dash.source) : [1], backgroundColor: ['#0f172a', '#3b82f6', '#10b981', '#06b6d4'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } } });
            
            if(document.getElementById('chartTask')) this.chartInstances.c7 = new Chart(document.getElementById('chartTask'), { type: 'doughnut', data: { labels: ['Đã xong', 'Đang xử lý'], datasets: [{ data: [dash.task.done, dash.task.pending], backgroundColor: ['#10b981', '#e2e8f0'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '80%', rotation: -90, circumference: 180, plugins: { legend: { position: 'bottom' } } } });
            
            let rankLabels = Object.keys(dash.staffRank);
            if(document.getElementById('chartStaffRank')) this.chartInstances.c8 = new Chart(document.getElementById('chartStaffRank'), { type: 'bar', data: { labels: rankLabels.length ? rankLabels : ['Trống'], datasets: [{ label: 'Doanh số (Tr)', data: rankLabels.length ? Object.values(dash.staffRank) : [0], backgroundColor: '#3b82f6', borderRadius: 4 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { display: false } }, x: { beginAtZero: true, grid: { display: false } } } } });

        } catch (error) {
            this.showPopup("Lỗi lấy dữ liệu Tổng quan: " + error.message, false);
        } finally {
            this.hideL();
        }
    }
});
