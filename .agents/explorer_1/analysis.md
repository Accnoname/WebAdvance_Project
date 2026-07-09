# Báo cáo Phân tích Tích hợp Giỏ hàng & Đặt bàn (Cart & Reservation Integration Flow)

## 1. Tóm tắt kết quả cốt lõi (Core Findings Summary)
Qua quá trình phân tích mã nguồn hệ thống (cả frontend và backend), chúng tôi đã phát hiện **11 vấn đề nghiêm trọng** liên quan đến luồng dữ liệu (Data Flow), Trải nghiệm người dùng (UI/UX), Lỗi cú pháp (Syntax Errors), và Tính đồng bộ trạng thái (Sync States). Đáng chú ý nhất là lỗi `ReferenceError` trong việc cập nhật ghi chú giỏ hàng, việc mất hoàn toàn dữ liệu biến thể (variant) và ghi chú (note) của món ăn khi chuyển từ Giỏ hàng sang Đặt bàn, và lỗi không giải phóng bàn ăn khi đơn đặt bàn bị hủy.

---

## 2. Phân tích chi tiết luồng dữ liệu (Data Flow) & Vấn đề phát hiện

### Vấn đề 1: Lỗi cú pháp (ReferenceError) trong `cartStore.js` `updateNote`
- **Mô tả**: Hàm `updateNote` trong store của giỏ hàng (`frontend/src/store/cartStore.js`) tham chiếu đến biến `variant` trong thân hàm nhưng biến này không được khai báo trong danh sách tham số.
- **Minh chứng**:
  * Tại `frontend/src/store/cartStore.js` (dòng 130-141):
    ```javascript
    updateNote: (menuItemId, oldNote = '', newNote = '') => {
      const state = get();
      const itemExistsWithNewNote = state.items.some(
        (i) => i.menuItem._id === menuItemId && i.note === newNote && i.variant === variant
      );

      let newItems = [];
      if (itemExistsWithNewNote && oldNote !== newNote) {
        const itemToUpdate = state.items.find(
          (i) => i.menuItem._id === menuItemId && i.note === oldNote && i.variant === variant
        );
    ```
  * Biến `variant` ở dòng 133 và 139 không được định nghĩa trong tham số hàm `(menuItemId, oldNote = '', newNote = '')`.
- **Hệ quả**: Khi khách hàng cố gắng cập nhật ghi chú của món ăn tại trang Giỏ hàng (`CartPage.jsx` dòng 298), ứng dụng sẽ bị crash ngay lập tức với lỗi: `ReferenceError: variant is not defined`.

### Vấn đề 2: Sai lệch tham số (Parameter Mismatch) giữa Call-site và Function Signature trong `cartStore.js`
- **Mô tả**: Trang giỏ hàng truyền tham số `variant` khi gọi các hàm `removeItem` và `updateQuantity` trong store, nhưng store không hỗ trợ hoặc định nghĩa sai vị trí tham số.
- **Minh chứng**:
  * Tại `CartPage.jsx` dòng 307 & 316:
    ```jsx
    onClick={() => updateQuantity(item.menuItem._id, item.note, item.variant, item.quantity - 1)}
    ```
  * Nhưng tại `cartStore.js` dòng 108:
    ```javascript
    updateQuantity: (menuItemId, note = '', quantity) => {
    ```
- **Hệ quả**: Tham số thứ 3 được truyền là `item.variant` (ví dụ: chuỗi `"Cay vừa"`) sẽ map vào biến `quantity` trong store. Biểu thức `"Cay vừa" <= 0` trả về `false`, và store sẽ lưu số lượng món ăn thành chuỗi `"Cay vừa"` thay vì số lượng mới. Điều này làm hỏng dữ liệu giỏ hàng.
  * Tương tự, `removeItem` trong store chỉ nhận `(menuItemId, note = '')` nhưng `CartPage.jsx` truyền cả `item.variant` ở dòng 330. Nếu giỏ hàng có 2 món ăn cùng ID và ghi chú nhưng khác biến thể, cả hai sẽ bị xóa cùng lúc.

### Vấn đề 3: Thiếu trường `variant` trong Schema của Giỏ hàng (`Cart`) và Đơn hàng (`Order`)
- **Mô tả**: Trong khi `Reservation.model.js` có hỗ trợ trường `variant` (biến thể món ăn), thì `Cart.model.js` và `Order.model.js` lại hoàn toàn bỏ qua trường này.
- **Minh chứng**:
  * `Reservation.model.js` dòng 7:
    ```javascript
    variant:  { type: String, default: null },
    ```
  * `Cart.model.js` dòng 3-8:
    ```javascript
    const cartItemSchema = new mongoose.Schema({
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
      quantity: { type: Number, required: true, min: 1 },
      price:    { type: Number, required: true },
      note:     { type: String, default: '' },
    }, { _id: false });
    ```
  * `Order.model.js` dòng 3-13 cũng tương tự (không có `variant`).
- **Hệ quả**: Bất kỳ thông tin lựa chọn biến thể nào từ phía khách hàng đều bị mất khi lưu vào giỏ hàng trên DB hoặc khi tạo đơn hàng.

### Vấn đề 4: Khởi tạo Pre-order gộp món và bỏ qua ghi chú, biến thể từ Giỏ hàng
- **Mô tả**: Khi người dùng nhấn nút "Dùng giỏ này Đặt Bàn", trang Đặt bàn (`ReservationPage.jsx`) khởi tạo danh sách món đặt trước bằng cách gộp tất cả món ăn chỉ theo ID món (`menuItem._id`), làm mất ghi chú và biến thể riêng lẻ.
- **Minh chứng**:
  * Tại `ReservationPage.jsx` dòng 99-110:
    ```javascript
    const [preOrderItems, setPreOrderItems] = useState(() => {
      const cartItems = useCartStore.getState().items;
      const initialItems = {};
      cartItems.forEach(item => {
        if (initialItems[item.menuItem._id]) {
          initialItems[item.menuItem._id].quantity += item.quantity;
        } else {
          initialItems[item.menuItem._id] = { menuItem: item.menuItem, quantity: item.quantity };
        }
      });
      return initialItems;
    });
    ```
- **Hệ quả**: Nếu giỏ hàng có 2 cốc Trà sữa (1 cốc không đá, 1 cốc ít đường), khi chuyển sang trang đặt bàn, hệ thống sẽ gộp thành 2 cốc Trà sữa và xóa sạch ghi chú "không đá" và "ít đường".

### Vấn đề 5: Submit Đặt bàn bỏ qua hoàn toàn thông tin món ăn tùy chỉnh
- **Mô tả**: Khi thực hiện gửi yêu cầu đặt bàn, payload gửi lên API bị lược bỏ trường `note` và `variant` cho từng món đặt trước.
- **Minh chứng**:
  * Tại `ReservationPage.jsx` dòng 202-206:
    ```javascript
    const itemsPayload = Object.values(preOrderItems).map(i => ({
      menuItem: i.menuItem._id,
      quantity: i.quantity,
      price: i.menuItem.price
    }));
    ```
- **Hệ quả**: Trường `variant` và `note` trong `Reservation.model.js` sẽ luôn mang giá trị mặc định (null / rỗng). Nhà bếp không thể biết khách hàng muốn phục vụ món ăn như thế nào khi họ đến bàn.

---

## 3. Phân tích luồng tích hợp Backend (Business Logic & State Sync)

### Vấn đề 6: Trùng lịch và lệch múi giờ (Timezone Inconsistency) khi kiểm tra bàn trống
- **Mô tả**: Việc so sánh ngày giờ đặt bàn giữa `TableService.checkAvailability` và `ReservationService.create` không đồng nhất về múi giờ.
- **Minh chứng**:
  * Tại `reservation.service.js` line 19:
    ```javascript
    reservationDate: new Date(data.reservationDate)
    ```
    (Sử dụng định dạng ngày YYYY-MM-DD từ client sẽ khởi tạo ngày theo giờ UTC 00:00:00Z).
  * Tại `table.service.js` line 31-35:
    ```javascript
    reservationDate: {
      $gte: new Date(`${date}T00:00:00`),
      $lte: new Date(`${date}T23:59:59`)
    }
    ```
    (Khởi tạo ngày theo múi giờ địa phương của server).
- **Hệ quả**: Nếu múi giờ server lệch với UTC (ví dụ: GMT-5 hoặc GMT+7), các đơn đặt bàn có thể nằm ngoài khoảng truy vấn, dẫn đến hệ thống báo bàn trống trong khi thực tế bàn đã được đặt (Overbooking / Double Booking).

### Vấn đề 7: Không giải phóng bàn ăn khi đơn đặt bàn bị hủy (`da_huy`)
- **Mô tả**: Khi hủy đơn đặt bàn, trạng thái bàn ăn (nếu đã được gán) vẫn giữ nguyên là `dat_truoc` (hoặc `dang_phuc_vu` nếu đã lỡ check-in), không được trả về `trong`.
- **Minh chứng**:
  * Trong hàm `updateStatus` của `reservation.service.js` (dòng 50-196), không có bất kỳ logic nào xử lý khi `status === 'da_huy'` để đưa trạng thái bàn liên kết về `'trong'`.
- **Hệ quả**: Bàn ăn bị khóa trạng thái `dat_truoc` vĩnh viễn, nhân viên hoặc khách hàng khác không thể đặt hoặc sử dụng bàn đó.

### Vấn đề 8: Không liên kết đơn hàng mới với bàn ăn (`table.currentOrder`) khi khách đến (`da_den`)
- **Mô tả**: Khi khách đặt bàn đến nơi (`da_den`), hệ thống tự động chuyển trạng thái bàn thành `dang_phuc_vu` và tạo đơn hàng (`Order`) tương ứng. Tuy nhiên, trường `currentOrder` của bàn ăn không được cập nhật ID của đơn hàng vừa tạo.
- **Minh chứng**:
  * Tại `reservation.service.js` dòng 128-134:
    ```javascript
       // Cập nhật trạng thái bàn thành đang phục vụ
       await new Promise((resolve, reject) => {
         TableRepository.updateById(assignedTableId, { status: 'dang_phuc_vu' }, (err) => {
           if (err) return reject(err);
           resolve();
         });
       });
    ```
  * Trường `currentOrder` hoàn toàn bị bỏ quên không được cập nhật bằng `newOrder._id`.
- **Hệ quả**: Khi nhân viên mở sơ đồ bàn tại trang Staff/POS, bàn hiển thị trạng thái đang phục vụ nhưng hệ thống không liên kết được với đơn hàng nào. Nhân viên không thể xem danh sách món ăn, thêm món hoặc thanh toán cho bàn đó thông qua sơ đồ bàn.

### Vấn đề 9: Bỏ qua tầng dịch vụ (Service Layer) khi tự động tạo Đơn hàng từ Lịch đặt bàn
- **Mô tả**: Trong `reservation.service.js`, đơn hàng mới được tạo bằng cách gọi trực tiếp `OrderRepository.create` thay vì thông qua `OrderService.create`.
- **Hệ quả**: Bỏ qua các bước xác thực nghiệp vụ quan trọng trong `OrderService.create` như kiểm tra tính khả dụng của món ăn (isAvailable), cập nhật lịch sử bàn, hoặc tính toán voucher/khuyến mãi nếu có.

### Vấn đề 10: Mất thông tin Voucher/Khuyến mãi khi chuyển sang Đặt bàn
- **Mô tả**: Giỏ hàng có hỗ trợ voucher (`voucherCode`, `discountAmount`). Nhưng khi chuyển qua luồng Đặt bàn, thông tin voucher này hoàn toàn biến mất do schema `Reservation` không lưu trữ thông tin khuyến mãi.
- **Hệ quả**: Khách hàng không nhận được giảm giá cho đơn đặt trước khi đến nhà hàng.

---

## 4. Phân tích Trải nghiệm người dùng (UI/UX)

### Vấn đề 11: Trải nghiệm điền thông tin trùng lặp (Redundant Input)
- **Mô tả**: Khi người dùng đã đăng nhập và có sản phẩm trong giỏ hàng, họ nhấn "Dùng giỏ này Đặt Bàn". Nhưng ở Bước 4 (Xác nhận), họ vẫn phải nhập thủ công `Họ tên` và `Số điện thoại` của mình.
- **Hệ quả**: Tăng thao tác nhập liệu không cần thiết, làm giảm tỷ lệ hoàn thành đặt bàn trực tuyến của khách hàng thân thiết.
