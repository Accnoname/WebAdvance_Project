# ✅ Quyết Định Kiến Trúc Cuối Cùng
## Restaurant Management System — Final Architecture Decisions

> Cập nhật: 29/06/2026

---

## 📌 Q1 — Khách Gọi Món & Sơ Đồ Bàn (Quy Trình Mới)
**Quyết định: Nhân viên cấp QR động cho khách quét**
- **Bước 1:** Khách vào quán. Nhân viên mở màn hình Sơ Đồ Bàn (`/staff/tables`).
- **Bước 2:** Nhân viên bấm vào biểu tượng mã QR của một bàn trống. Một cửa sổ (Modal) chứa mã QR to, rõ ràng sẽ hiện ra ngay giữa màn hình.
- **Bước 3:** Khách hàng dùng điện thoại quét mã QR này. Mã QR chứa sẵn link dẫn vào Menu kèm số bàn (`/menu?table=5`).
- **Bước 4:** Khách tự chọn món và đặt hàng trên điện thoại của mình. Đơn sẽ được bắn thẳng xuống Bếp.
*(Nhân viên vẫn có thể tự mở bàn và gọi hộ nếu khách không có smartphone).*

## 📌 Q2 — Giá, Thuế, Khuyến Mãi & Thanh Toán
**Quyết định: Không tính phí VAT cứng. Đa dạng hình thức thanh toán.**
- **Khuyến mãi:** Hệ thống discount theo % hoặc tiền mặt cứng.
- **Thanh toán:** Khách có thể chọn thanh toán qua **VNPay** (online) hoặc **Tiền mặt / Chuyển khoản thủ công** tại quầy (offline). Thu ngân sẽ dùng màn hình Quản lý đơn (`/staff/orders`) để xác nhận đã thu tiền.

## 📌 Q3 — Thông Báo Khi Xong Món
**Quyết định: Trực quan hóa cao độ tại Bếp và Quầy**
- Bếp (`/staff/kitchen`) sử dụng giao diện cực sáng (Light Mode), số lượng món khổng lồ, viền đỏ cho đơn ưu tiên để tránh sai sót.
- Bếp bấm "XONG MÓN" → Trạng thái đơn được cập nhật real-time sang màn hình Điều Phối/Phục vụ.

## 📌 Q4 — Quy Trình Bếp (Smart Grouping + KDS)
**Quyết định: Chế độ Gom Món (Aggregated View) là cốt lõi**
- Bếp không nhìn theo từng đơn nhỏ lẻ lắt nhắt, mà hệ thống sẽ gom chung các món giống nhau (VD: 5 Bò Bít Tết từ 3 bàn khác nhau).
- Bếp nấu chung 1 mẻ 5 phần, sau đó bấm "TRẢ ĐỦ 5 PHẦN" → Hệ thống tự động chia ngược 5 phần đó về đúng 3 bàn đang đợi.
