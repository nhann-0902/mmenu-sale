Object.assign(window.App, {
    async searchFeature() {
        const queryEl = document.getElementById('featureSearchInput');
        if(!queryEl || !queryEl.value.trim()) {
            this.showPopup("Vui lòng nhập câu hỏi về tính năng!", false);
            return;
        }

        this.showL();
        safeStyle('featureResultArea', 'display', 'none'); 

        try {
            // LƯU Ý: Nếu URL script này thay đổi, bạn cần cập nhật lại link Deploy mới nhất ở đây
            const GAS_URL = 'https://script.google.com/macros/s/AKfycbybRt13WJ8cHfTYCfDPFADMXEvAuvLH_wqh9fOJmlfFuOG8JUUtd3-kdNt_Rc015aDT/exec';

            const res = await fetch(GAS_URL, {
                method: 'POST',
                body: JSON.stringify({ action: "search_feature", query: queryEl.value.trim() }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' } 
            });

            const data = await res.json();

            if(data.status === 'success') {
                safeSet('featureSummaryText', data.summary);

                let html = '';
                if(data.details && data.details.length > 0) {
                    data.details.forEach((item, idx) => {
                        html += `<tr style="border-bottom: 1px dashed var(--border); transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                            <td style="padding: 12px; font-weight:800; color:var(--text-light); text-align: center;">${idx + 1}</td>
                            <td style="padding: 12px; font-weight:800; color:var(--accent);">${item.module}</td>
                            <td style="padding: 12px; color:var(--primary); line-height:1.5;">${item.desc}</td>
                        </tr>`;
                    });
                } else {
                    html = `<tr><td colspan="3" style="text-align:center; padding:15px; font-style:italic; color:var(--text-light);">Không có dữ liệu chi tiết</td></tr>`;
                }
                safeSet('featureTableBody', html, 'html');
                safeStyle('featureResultArea', 'display', 'block');
            } else {
                 this.showPopup("Lỗi xử lý từ máy chủ: " + data.message, false);
            }
        } catch (error) {
            this.showPopup("Lỗi kết nối tới Trạm thu thập: " + error.message, false);
        } finally {
            this.hideL();
        }
    }
});
