# 🎨 RULE_FRONTEND.md — Bộ Quy Chuẩn Thiết Kế Giao Diện

> AI **BẮT BUỘC** đọc file này TRƯỚC KHI viết bất kỳ dòng JSX/CSS nào.
> Đây là "Hiến pháp" thiết kế của dự án — không được vi phạm.

---

## 🏛️ Định Nghĩa Hệ Thống

**Đây là Hệ Thống Tích Hợp Toàn Diện (All-in-One Integrated System)** của một nhà hàng uy tín.
Không phải web quảng cáo đơn thuần. Không phải phần mềm quản lý nội bộ.
Mà là sự kết hợp của cả hai — một thực thể sống động vừa có **mặt tiền bóng bẩy** vừa có **cỗ máy vận hành mạnh mẽ** ở hậu trường.

---

## 👥 Phân Quyền Vai Trò (Role-Based Access)

### Sơ đồ 3 Roles — Quyết định cuối cùng

```
ROLE: khach_hang
  Ai dùng:   Khách vãng lai (chưa login) + Khách đã đăng ký
  Mục tiêu:  Bị thuyết phục → Đặt món → Theo dõi đơn
  URL:       / (Landing Page) | /menu | /cart | /my-orders | /payment/:id

ROLE: nhan_vien  ← kiêm nhiệm: Phục vụ + Bếp + Điều phối ra món
  Ai dùng:   Nhân viên phục vụ (dùng /staff/tables)
             Nhân viên bếp (dùng /staff/kitchen)
             Nhân viên điều phối (dùng /staff/orders)
             Thu ngân (bấm "Đã thu tiền" trên /staff/orders)
  Mục tiêu:  Xử lý đơn nhanh, ít nhầm lẫn, ít thao tác nhất có thể
  URL:       /staff | /staff/tables | /staff/kitchen | /staff/orders

ROLE: quan_ly  ← kiêm nhiệm: Quản lý vận hành + Tài chính
  Ai dùng:   Quản lý ca, Chủ nhà hàng
  Mục tiêu:  Ra quyết định từ dữ liệu, kiểm soát toàn bộ hệ thống
  URL:       /manager | /manager/menu | /manager/tables
             /manager/staff | /manager/reports
```

### Bảng phân quyền chi tiết

| Tính năng | Khách hàng | Nhân viên | Quản lý |
|---|:---:|:---:|:---:|
| Xem Landing Page | ✅ | ✅ | ✅ |
| Xem Thực đơn đầy đủ | ✅ | ✅ | ✅ |
| Đặt món / Giỏ hàng | ✅ | ❌ | ❌ |
| Theo dõi đơn của mình | ✅ | ❌ | ❌ |
| Màn hình Bếp (KDS) | ❌ | ✅ | ✅ |
| Quản lý Bàn | ❌ | ✅ (xem+cập nhật) | ✅ (toàn quyền) |
| Danh sách tất cả đơn | ❌ | ✅ | ✅ |
| Thu tiền (ghi nhận) | ❌ | ✅ | ✅ |
| Quản lý Menu | ❌ | ❌ | ✅ |
| Quản lý Nhân viên | ❌ | ❌ | ✅ |
| Dashboard & Báo cáo | ❌ | ❌ | ✅ |
| Doanh thu & Kiểm toán | ❌ | ❌ | ✅ |

---

## 🔄 Luồng Chuyển Đổi Hoàn Chỉnh (Conversion Funnel)

```
[1] KHÁCH VÃNG LAI truy cập web
        ↓
[2] Landing Page → Storytelling Scroll 4 Section
    Hero (kích thích) → Story (tin tưởng) → Menu (thèm muốn) → CTA (chốt)
        ↓
[3] Click "Đặt Bàn" → Yêu cầu Đăng nhập/Đăng ký
        ↓
[4] KHÁCH HÀNG quét QR bàn → Vào MenuPage → Chọn món → Giỏ hàng → Gửi đơn
        ↓ (Socket.IO emit tức thì)
[5] NHÂN VIÊN BẾP (/staff/kitchen) → Nhận thông báo + tiếng chuông
    → Bấm "Bắt đầu nấu" → Bấm "Xong — Mang ra"
        ↓ (Socket.IO emit lên màn hình khách)
[6] NHÂN VIÊN PHỤC VỤ (/staff/orders) → Thấy món sẵn sàng → Mang ra bàn
    → Bấm "Đã phục vụ" → Cập nhật trạng thái bàn
        ↓
[7] Thanh toán:
    Online (VNPay) → Khách tự quét → Hệ thống tự cập nhật
    Tiền mặt → Nhân viên bấm "Đã thu tiền" trên /staff/orders
        ↓ (Tự động ghi nhận vào hệ thống)
[8] QUẢN LÝ (/manager) → Sáng hôm sau xem Dashboard
    → Doanh thu | Số đơn | Bàn nào bận nhất | Món nào bán chạy
```

---

## 🧠 Triết Lý Thiết Kế Cốt Lõi

Hệ thống có **3 personas** người dùng với tâm lý và nhu cầu hoàn toàn khác nhau.
Mỗi persona phải được thiết kế theo **một tư duy riêng biệt** — KHÔNG dùng chung component style.

```
KHÁCH HÀNG   →  Kích thích vị giác, dẫn dắt cảm xúc, thuyết phục chốt đơn
NHÂN VIÊN    →  Tốc độ tối đa, rõ ràng tuyệt đối, giảm tải trọng nhận thức về 0
QUẢN LÝ      →  Dữ liệu sống, kiểm soát tổng thể, ra quyết định nhanh
```

---

## 🌅 PERSONA 1: KHÁCH HÀNG (Customer Storefront)

### Mục tiêu UX
Chuyển đổi **khách vãng lai** thành **khách đặt món** qua trải nghiệm cảm xúc.
Luồng cảm xúc: Tò mò → Thèm muốn → Tin tưởng → Chốt đơn.

### Bản đồ các trang (Customer Pages)

```
/ (LandingPage)           — Storytelling Scroll 4 Section, KHÔNG cần login
/menu                     — Thực đơn đầy đủ, lọc theo danh mục, tìm kiếm
/cart                     — Giỏ hàng, xem lại đơn, ghi chú, gửi đơn
/my-orders                — Timeline theo dõi tiến độ đơn realtime
/payment/:orderId         — Trang thanh toán (VNPay QR hoặc xác nhận tiền mặt)
/login | /register        — Auth pages (thiết kế Premium, không phải form trắng)
```

### Cấu trúc Landing Page (Storytelling Scroll)
Mỗi Section là một "màn hình cảm xúc". KHÔNG để khách phải click nhiều tab:

```
Section 1 — HERO (Điểm chạm thị giác, 100vh)
  → Hình ảnh/video chiếm TOÀN MÀN HÌNH, chất lượng cực cao
  → Overlay gradient tối nhẹ để chữ nổi lên
  → Slogan: tối đa 5-7 từ. Ví dụ: "Hương vị nguyên bản từ 1990"
  → Sub-text: 1 câu mô tả ngắn gọn về phong cách nhà hàng
  → Nút CTA DUY NHẤT: pill button "Khám Phá Thực Đơn ↓"
  → Navbar: trong suốt (glass), chỉ hiện logo + nút Login/Menu

Section 2 — OUR STORY (Xây dựng niềm tin, ~80vh)
  → Layout bất đối xứng: Hình ảnh lớn bên trái (60%), chữ bên phải (40%)
  → KHÔNG viết quá 3-4 dòng văn xuôi — dùng ảnh để nói thay
  → 3 điểm nhấn nhanh (icon + số): "35 năm kinh nghiệm", "100% nguyên liệu sạch"
  → Ảnh fade-in từ trái, chữ fade-in từ phải (Intersection Observer)

Section 3 — SIGNATURE MENU (Kích thích hành động, ~90vh)
  → Chỉ show 4-6 món "đỉnh" nhất (Bestsellers) — KHÔNG bê nguyên cả menu
  → Hình ảnh món ăn chiếm 75% diện tích card
  → Mỗi card: Tên món + Giá + nút "Xem thêm" mờ nhạt
  → Hover: Scale(1.05) + overlay tối + hiện nút "Đặt ngay"
  → Nút dưới section: "Xem Full Menu →"

Section 4 — SOCIAL PROOF & CTA (Chốt chuyển đổi, ~70vh)
  → Hình ảnh không gian nhà hàng đông khách, ấm cúng
  → 2-3 review ngắn gọn (tên + avatar + 1-2 câu) từ khách thực
  → 2 nút rõ ràng ngang hàng: [Đặt Bàn Ngay] và [Xem Full Menu]
  → Footer nhẹ nhàng: địa chỉ, giờ mở cửa, SĐT

Section 5 — FOOTER
  → Nền tối hơn section trên
  → Logo + Slogan ngắn
  → Links: Menu | Liên hệ | Chính sách | Mạng xã hội
```

### Màu sắc & Typography (Customer)
```
Hướng: Tối & Sang trọng (Dark Premium Fine Dining)
  Nền chính:   #1a1208  (Nâu đen đậm - như bàn gỗ cũ)
  Nền phụ:     #2d1f0a  (Nâu đậm ấm)
  Nền section: #0f0a05  (Gần đen - tăng chiều sâu)
  Chữ chính:   #f5e6c8  (Vàng ngà ấm - dễ đọc trên nền tối)
  Chữ phụ:     #a89070  (Nâu vàng nhạt)
  Accent:      #f97316  (Cam primary — CTA buttons)
  Gold:        #d4a85a  (Vàng đồng — tiêu đề, đường kẻ trang trí)
  Glass:       rgba(255,255,255,0.08) backdrop-blur — navbar, card overlay

Typography:
  Display Font:  "Playfair Display" — tiêu đề lớn, tên section, tên món ăn
  Body Font:     "Lato" — mô tả, nội dung đọc nhiều, paragraph
  Number Font:   "DM Mono" — giá tiền, số lượng, thống kê nhỏ
  Import:        Phải có trong index.html <link> Google Fonts
```

### Animation Rules (Customer)
```
✅ Fade-in Up: Section content khi scroll vào viewport
   opacity: 0→1, translateY: 20px→0, duration: 600ms
   easing: cubic-bezier(0.4, 0, 0.2, 1)

✅ Parallax Hero: Ảnh nền cuộn chậm hơn 0.4x khi scroll
   Dùng: background-attachment: fixed (CSS thuần, dễ nhất)

✅ Staggered reveal: Các card trong grid hiện lần lượt
   animation-delay: 0ms, 100ms, 200ms, 300ms...

✅ Hover card món ăn: transform: scale(1.05), duration: 300ms
   + overlay tối hiện thêm nút action

✅ Navbar transition: Trong suốt (top) → Màu tối + blur (khi scroll)

❌ KHÔNG dùng bounce, shake, flash, hoặc bất kỳ animation gây mất tập trung
❌ KHÔNG để animation chạy khi người dùng đã kéo scroll qua rồi (one-time trigger)
❌ KHÔNG dùng animation > 700ms (cảm giác chậm, nặng nề)
❌ KHÔNG autoplay video có âm thanh
```

### Component Standards (Customer)
```jsx
// Nút CTA chính — pill shape, shadow lớn
<button className="px-10 py-4 bg-primary-500 text-white font-bold text-lg
  rounded-full shadow-xl shadow-primary-500/40 hover:bg-primary-600
  hover:scale-105 transition-all duration-300 active:scale-95
  tracking-wide">
  Khám Phá Thực Đơn
</button>

// Nút CTA phụ — ghost style
<button className="px-10 py-4 border-2 border-amber-400/60 text-amber-200
  font-bold text-lg rounded-full hover:border-amber-400 hover:bg-amber-400/10
  transition-all duration-300">
  Xem Full Menu
</button>

// Card Món ăn Signature — hình ảnh chiếm 75%
<div className="group relative overflow-hidden rounded-2xl cursor-pointer
  aspect-[3/4] bg-stone-900 shadow-xl">
  <img className="absolute inset-0 w-full h-full object-cover
    transition-transform duration-700 group-hover:scale-110" />
  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95
    via-stone-950/20 to-transparent" />
  <div className="absolute bottom-0 p-5 w-full">
    <h3 className="font-display text-xl text-amber-100 font-bold">{name}</h3>
    <p className="text-primary-400 font-mono font-bold mt-1">{price}đ</p>
  </div>
</div>
```

---

## 👨‍🍳 PERSONA 2: NHÂN VIÊN (Kitchen/Staff Interface)

### Mục tiêu UX
**Tốc độ và độ chính xác** trong môi trường nóng bức, ồn ào, tay đang bận.
Nhân viên chỉ cần **liếc mắt** là biết ngay: việc gì → cần làm ngay.

### Bản đồ các trang (Staff Pages)

```
/staff                    — Dashboard nhân viên: tóm tắt nhanh, link nhanh
/staff/kitchen            — Màn hình Bếp (KDS): nhận đơn, nấu, báo xong
/staff/tables             — Sơ đồ bàn: xem trạng thái, cập nhật bàn
/staff/orders             — Danh sách đơn: điều phối ra món, thu tiền mặt
```

### Phân công giao diện theo vị trí làm việc

```
Nhân viên BẾP → dùng /staff/kitchen
  Thiết bị: Màn hình/tablet treo tường trong bếp
  Cần: Tên món TO, số lượng RẤT TO, nút "Nấu/Xong" đơn giản

Nhân viên PHỤC VỤ → dùng /staff/tables + /staff/orders
  Thiết bị: Tablet cầm tay hoặc điện thoại
  Cần: Thấy bàn nào trống, đơn nào đã xong để mang ra

Nhân viên ĐIỀU PHỐI / THU NGÂN → dùng /staff/orders
  Thiết bị: Máy tính quầy lễ tân
  Cần: Tổng đơn, trạng thái thanh toán, bấm "Đã thu tiền"
```

### Nguyên Tắc Thiết Kế (Staff Design Rules)

#### Kích thước tối thiểu BẮT BUỘC
```
Nút bấm hành động:     MIN 56px height (ngón tay to, đeo găng tay vẫn bấm được)
Tên món ăn:            MIN font-size 20px, font-weight 700 (đọc từ xa 1m)
Số lượng món:          MIN font-size 32px, font-weight 900 (số to nhất trên card)
Số bàn:                MIN font-size 24px, font-weight 700
Badge trạng thái:      MIN 28px height, chữ MIN 14px, màu rõ
Khoảng cách giữa nút: MIN gap-3 (tránh bấm nhầm)
```

#### Màu trạng thái — Nhận ra ngay mà không cần đọc chữ
```
CHỜ NẤU (cho_xac_nhan):    nền #fef2f2, viền 2px #ef4444 — ĐỎ rực = KHẨN CẤP
ĐANG NẤU (dang_che_bien):   nền #fffbeb, viền 2px #f59e0b — VÀNG = ĐANG XỬ LÝ
XONG (hoan_thanh):          nền #f0fdf4, viền 2px #22c55e — XANH = HOÀN THÀNH
HỦY (huy):                  nền #f8fafc, viền 2px #94a3b8 — XÁM = VÔ HIỆU
ƯU TIÊN (priority):         nền #fff0f0, viền 2px #e11d48, pulse animation — ĐỎ NHẤP NHÁY
```

#### Layout và màu nền
```
✅ Background: #0d1117 (Gần đen) — giảm mỏi mắt dưới ánh đèn bếp
✅ Card bàn/đơn: #1a2235 (Navy tối) — nổi lên trên nền
✅ Độ tương phản tối thiểu 7:1 (WCAG AAA)
✅ Grid: 2 cột desktop, 1 cột tablet (để card to, dễ đọc)
✅ Nút action: Full width trong card (không nút nhỏ lẻ)
✅ Font: "DM Sans" — đậm, rõ ràng, không mảnh

❌ KHÔNG dùng tooltip — không có thời gian hover trong bếp
❌ KHÔNG dùng dropdown nhiều cấp — quá nhiều thao tác
❌ KHÔNG để text màu nhạt trên nền tối nhạt
❌ KHÔNG dùng icon nhỏ hơn 20px mà không có text label kèm theo
❌ KHÔNG pagination — load tất cả đơn active trong 1 trang
```

#### Component chuẩn bếp
```jsx
// Nút "Bắt đầu nấu" — TO, màu nổi, chữ rõ
<button className="w-full py-4 min-h-[56px] bg-amber-500 hover:bg-amber-400
  text-stone-950 text-lg font-black rounded-xl tracking-wide
  shadow-lg shadow-amber-500/40 active:scale-95 transition-all
  flex items-center justify-center gap-2">
  🔥 BẮT ĐẦU NẤU
</button>

// Nút "Xong — Mang ra"
<button className="w-full py-4 min-h-[56px] bg-green-500 hover:bg-green-400
  text-white text-lg font-black rounded-xl tracking-wide
  shadow-lg shadow-green-500/40 active:scale-95 transition-all
  flex items-center justify-center gap-2">
  ✅ XONG — MANG RA
</button>

// Số lượng món — to nhất trên card
<div className="text-4xl font-black text-primary-400
  bg-stone-800 w-14 h-14 flex items-center justify-center rounded-xl">
  {qty}
</div>

// Tên món — rõ, to
<h4 className="text-xl font-bold text-white leading-tight">{name}</h4>

// Số bàn — header của card
<h3 className="text-2xl font-bold text-white font-mono">
  BÀN {tableNumber}
</h3>
```

---

## 📊 PERSONA 3: QUẢN LÝ (Management Dashboard)

### Mục tiêu UX
Ra quyết định nhanh dựa trên **dữ liệu sống**.
Nhìn vào Dashboard 10 giây là biết: hôm nay nhà hàng chạy tốt không?

### Bản đồ các trang (Manager Pages)

```
/manager                  — Dashboard: KPI, realtime, quick actions
/manager/menu             — Quản lý Thực đơn: CRUD món, bật/tắt, upload ảnh
/manager/tables           — Quản lý Bàn: thêm/xóa bàn, xem QR code, sơ đồ
/manager/staff            — Quản lý Nhân viên: danh sách, phân quyền
/manager/reports          — Báo cáo: doanh thu theo ngày/tuần/tháng, xuất file
```

### Cấu trúc Dashboard (Executive Analytics Layout)
```
HEADER BAR
  Logo nhà hàng | Tên quản lý | Thời gian thực | Nút đăng xuất

ROW 1 — KPI CARDS (4 thẻ ngang nhau)
  [Tổng đơn hôm nay] [Doanh thu ước tính] [Bàn đang phục vụ] [Đơn chờ bếp]
  Mỗi card: Icon + Số to + Label + Trend so với hôm qua (↑↓%)

ROW 2 — REALTIME STATUS (chia 2 cột)
  Trái (60%): Danh sách đơn đang active — tên bàn, tổng tiền, trạng thái
              Mỗi row highlight màu theo trạng thái
  Phải (40%): Sơ đồ bàn mini — grid các bàn, màu theo trạng thái
              Click vào bàn → popup tóm tắt đơn hiện tại

ROW 3 — QUICK ACTIONS (4 nút lớn)
  [Quản lý Menu] [Quản lý Bàn] [Quản lý Nhân viên] [Xem Báo cáo]

ROW 4 — SUMMARY (cuối trang)
  Món bán chạy nhất hôm nay (top 3)
  Giờ cao điểm (biểu đồ đơn giản theo giờ)
  Tổng doanh thu tuần này
```

### Màu sắc & Typography (Manager)
```
Hướng: Professional Executive Dashboard
  Sidebar:        #0f172a  (Navy đậm)
  Nền chính:      #f1f5f9  (Slate 100 — xám trắng nhẹ)
  Nền card:       #ffffff
  Accent chính:   #f97316  (Cam — highlight số liệu quan trọng)
  Accent success: #10b981  (Xanh lá — doanh thu, tốt)
  Accent danger:  #ef4444  (Đỏ — cảnh báo, giảm)
  Accent info:    #3b82f6  (Xanh — link, thông tin)
  Text chính:     #0f172a  (Gần đen)
  Text phụ:       #64748b  (Slate 500)
  Border:         #e2e8f0  (Slate 200 — nhẹ nhàng)

Typography:
  Display Font:  "Syne" — tiêu đề Dashboard, tên trang
  Data Font:     "DM Mono" — số liệu doanh thu, thống kê, giá tiền
  Body Font:     "Inter" — bảng dữ liệu, danh sách, form
```

### KPI Card Standard
```jsx
const KPICard = ({ title, value, subtitle, icon: Icon, trend, colorClass }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100
    shadow-sm hover:shadow-md transition-all duration-200 group">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg
          ${trend >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
      {value}
    </div>
    <div className="text-sm font-medium text-slate-500 mt-1">{title}</div>
    {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
  </div>
);
```

### Sơ đồ bàn (Table Map)
```jsx
const TABLE_STATUS_STYLES = {
  trong:        { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-800', label: 'Trống' },
  dang_phuc_vu: { bg: 'bg-rose-50',    border: 'border-rose-400',    text: 'text-rose-800',    label: 'Đang phục vụ' },
  dat_truoc:    { bg: 'bg-amber-50',   border: 'border-amber-400',   text: 'text-amber-800',   label: 'Đặt trước' },
  dong:         { bg: 'bg-slate-100',  border: 'border-slate-300',   text: 'text-slate-500',   label: 'Đóng' },
};
// Card bàn: MIN 120x120px để dễ đọc trong sơ đồ
// Hover: hiện tooltip tóm tắt đơn đang chạy
```

---

## 🚫 Global UI Rules — Áp dụng cho TẤT CẢ Personas

### Fonts ĐƯỢC PHÉP dùng
```
✅ Playfair Display  → Customer: tiêu đề, tên section, tên món
✅ Lato              → Customer: body text, mô tả
✅ DM Sans           → Staff: tất cả text trong giao diện bếp
✅ DM Mono           → Số liệu, giá tiền, doanh thu (mọi persona)
✅ Syne              → Manager: tiêu đề Dashboard
✅ Inter             → Manager: bảng dữ liệu, danh sách, form

❌ Arial, Helvetica, system-ui    — quá generic, thiếu cá tính
❌ Space Grotesk                  — overused AI-gen design
❌ Roboto thuần                   — quá corporate, nhàm chán
```

### Icons Quy Chuẩn
```
✅ Lucide React      → Bắt buộc dùng cho toàn bộ hệ thống
✅ Độ dày viền icon  → Chỉ dùng stroke-[1.5] hoặc stroke-2 (không dùng nét quá dày)
✅ Màu sắc           → Đồng bộ theo Persona (Customer: Vàng kim #d4a85a; Staff: trắng/tương phản)

❌ Cấm dùng Emoji hệ thống làm biểu tượng chính trong các thẻ chọn, danh sách của Khách hàng
   (Gây mất đồng bộ màu sắc và làm giao diện bị nhí nhố, thiếu sang trọng)
```

### Kích thước nút tối thiểu (TOÀN HỆ THỐNG)
```
Nút nhỏ (action phụ):    MIN height 36px
Nút vừa (action chính):  MIN height 44px
Nút to (bếp/CTA):        MIN height 56px
KHÔNG có nút nào nhỏ hơn 36px bất kể ở đâu
```

### Forbidden Patterns — Cấm tuyệt đối
```
❌ Card trắng + shadow mờ nhạt + border-radius 8px — quá generic AI design
❌ Purple/blue gradient trên nền trắng — cliché SaaS template
❌ alert() / confirm() của trình duyệt — dùng modal/toast custom
❌ Loading indicator nhỏ khó nhìn — dùng skeleton loading hoặc spinner rõ ràng
❌ Icon < 16px không có text label kèm theo trong giao diện thao tác nhanh
❌ Text màu slate-400/gray-400 trên nền trắng (độ tương phản thấp)
❌ Tooltip chứa thông tin quan trọng (không phải mọi người đều hover)
❌ Dropdown nhiều cấp cho hành động phổ biến
```

### Spacing System
```
Padding nút:     px-4 py-2 (nhỏ) | px-6 py-3 (vừa) | px-8 py-4 (to)
Padding card:    p-4 (compact) | p-6 (standard) | p-8 (hero/featured)
Section gap:     py-16 sm:py-20 (vừa) | py-24 sm:py-32 (landing page lớn)
Grid gap:        gap-4 (dense) | gap-6 (standard) | gap-8 (loose)
```

### Responsive — Thiết bị thực tế từng role
```
Mobile (< 640px):     Khách hàng dùng điện thoại — 1 cột, CTA nổi bật
Tablet (640-1024px):  Nhân viên bếp dùng tablet — 2 cột, nút to
Desktop (> 1024px):   Quản lý dùng máy tính — 3-4 cột, dashboard đầy đủ
```

---

## 🔄 Animation System Chuẩn

### Keyframes (định nghĩa trong tailwind.config.js)
```js
'fade-in-up':     { '0%': { opacity: 0, transform: 'translateY(20px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' } }
'fade-in':        { '0%': { opacity: 0 }, '100%': { opacity: 1 } }
'slide-in-right': { '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' } }
'scale-in':       { '0%': { transform: 'scale(0.95)', opacity: 0 },
                    '100%': { transform: 'scale(1)', opacity: 1 } }
'pulse-border':   { '0%, 100%': { borderColor: '#ef4444' },
                    '50%': { borderColor: '#fca5a5' } }
```

### useInView Hook — Bắt buộc dùng cho Landing Page
```jsx
// File: frontend/src/hooks/useInView.js
import { useRef, useState, useEffect } from 'react';

const useInView = (threshold = 0.15, rootMargin = '0px') => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // trigger 1 lần duy nhất
        }
      },
      { threshold, rootMargin }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [ref, isInView];
};

export default useInView;

// Cách dùng:
const [ref, isInView] = useInView(0.2);
<div
  ref={ref}
  className={`transition-all duration-700 ease-out ${
    isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
  }`}
>
  {/* content */}
</div>
```

### Staggered Animation — Dùng cho grid cards
```jsx
// Dùng style={{ animationDelay }} cho từng item trong grid
{items.map((item, index) => (
  <div
    key={item._id}
    className="animate-fade-in-up"
    style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
  >
    <ItemCard item={item} />
  </div>
))}
```

---

## 📐 Checklist Bắt Buộc Trước Khi Viết Component

```
□ 1. Xác định PERSONA: Khách hàng / Nhân viên / Quản lý?
□ 2. Đọc lại section của persona đó trong file này
□ 3. Áp dụng đúng bộ màu của persona đó (KHÔNG mix màu giữa personas)
□ 4. Font: Đã import từ Google Fonts chưa? Dùng đúng font của persona?
□ 5. Kích thước nút: MIN 36px everywhere, MIN 56px trong bếp?
□ 6. Tương phản màu chữ/nền: Đạt 4.5:1 tối thiểu?
□ 7. Loading state: Có skeleton/spinner rõ ràng?
□ 8. Error state: Có thông báo lỗi rõ ràng (react-hot-toast)?
□ 9. Empty state: Có hình/text khi không có data?
□ 10. Responsive: Mobile (khách) + Tablet (bếp) + Desktop (quản lý)?
□ 11. Animation: Dùng Intersection Observer cho scroll effects?
□ 12. Không dùng font/màu/pattern trong danh sách cấm?
□ 13. Không dùng alert()/confirm() native browser?
```

---

*Cập nhật: 29/06/2026 | Restaurant Management System — Frontend Design Bible v2.0*
*Phản ánh đúng hệ thống All-in-One Integrated F&B Platform của nhà hàng uy tín*
