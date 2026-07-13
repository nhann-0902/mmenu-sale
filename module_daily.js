async syncGetflyData() {
        let d_date = document.getElementById('d_date');
        let dateVal = d_date ? d_date.value : '';
        if (!dateVal) {
            this.showPopup("Vui lòng chọn Ngày báo cáo trước khi đồng bộ!", false);
            return;
        }

        const nameMapping = {
            "Văn Nhân": "Trương Nhân",
            "Anh Cường": "Đỗ Trí Cường",
            "Huyền Trang": "Đinh Thị Huyền Trang",
            "Minh Hoàng": "Minh Hoàng",
            "Thanh Dung": "Thanh Dung",
            "Bùi Hữu Quân": "Bùi Hữu Quân",
            "Cao Văn Đức": "Cao Văn Đức",
            "Mai Hương": "Mai Hương"
        };
        let mappedGetflyName = nameMapping[this.user] || this.user;

        this.showL();
        try {
            // DÁN URL CỦA GOOGLE APPS SCRIPT VÀO ĐÂY
            const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwoYcgjwe2ab5DW9Z-yeXLsUSMHZF5gXU3CGvJsc5rgB3Xy_Nouv-28kQrJbJEvReBH/exec';

            const response = await fetch(GAS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ 
                    action: "sync_getfly", 
                    date: dateVal, 
                    staffName: mappedGetflyName
                })
            });

            const resData = await response.json();

            // CHẾ ĐỘ DEBUG: Hiển thị nguyên văn dữ liệu Getfly trả về
            if (resData.status === 'debug') {
                this.hideL();
                let debugString = resData.raw_data;
                
                // Tạo một màn hình đen với ô copy to đùng
                let div = document.createElement('div');
                div.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:999999; display:flex; align-items:center; justify-content:center; padding:20px;";
                div.innerHTML = `
                    <div style="background:#fff; padding:25px; border-radius:12px; width:100%; max-width:600px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                        <h3 style="margin-top:0; color:#0f172a; margin-bottom: 15px;">DỮ LIỆU GETFLY THỰC TẾ:</h3>
                        <div style="font-size:12px; color:#ef4444; margin-bottom:10px;"><b>Hãy click vào ô bên dưới, bấm Ctrl+C (hoặc Sao chép) và gửi lên cho tôi!</b></div>
                        <textarea style="width:100%; height:350px; font-family:monospace; font-size:13px; padding:15px; border:2px solid #3b82f6; border-radius:8px; background:#f8fafc; resize:none;" onclick="this.select()">${debugString}</textarea>
                        <button onclick="this.parentElement.parentElement.remove()" style="margin-top:15px; width: 100%; padding:14px; background:#0f172a; color:#fff; font-weight:800; border:none; border-radius:8px; cursor:pointer;">ĐÓNG</button>
                    </div>`;
                document.body.appendChild(div);
                return;
            }

        } catch (err) {
            this.showPopup("Lỗi kết nối Trạm API: " + err.message, false);
        } finally {
            this.hideL();
        }
    },
