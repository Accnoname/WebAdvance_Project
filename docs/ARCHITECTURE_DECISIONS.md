# ✅ Quyết Định Kiến Trúc Cuối Cùng
## Restaurant Management System — Final Architecture Decisions

> Cập nhật: 29/06/2026

---

## 📌 Q1 — Khách Chọn Bàn
**Quyết định: 2 luồng song song**
- **Luồng Online (Khách tự phục vụ):** Quét QR trên bàn → Mở trình duyệt → `/menu?table=5`
- **Luồng Offline (Nhân viên hỗ trợ):** Nhân viên vào `/staff/tables` → Click vào bàn → "Mở bàn" + "Gọi món cho khách"

## 📌 Q2 — Giá, Thuế & Khuyến Mãi
**Quyết định: Không có VAT/phí dịch vụ cứng. Có hệ thống Discount.**
- Schema Discount mới: `%` hoặc tiền cứng, có thời hạn.
- Nhân viên/khách nhập mã lúc checkout.

## 📌 Q3 — Thông Báo Khi Xong Món
**Quyết định: Broadcast đến toàn bộ nhân viên đang online**
- SERVER broadcast đến room `staff` (mọi nhân viên rảnh sẽ nhận được thông báo để ra lấy món).

## 📌 Q4 — Quy Trình Bếp (Smart Grouping + Checklist)
**Quyết định: Cơ chế Checklist tại bếp — Gạch không xóa**
- Bếp tick từng món xong → Món bị gạch ngang. Khi tick hết tất cả mới bấm "Mâm đã xếp — Mang ra".
- Bật Grouped Mode: Tick theo từng bàn trong nhóm.
