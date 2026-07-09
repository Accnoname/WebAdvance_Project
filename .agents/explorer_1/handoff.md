# Báo cáo Bàn giao (Handoff Report) — Tích hợp Giỏ hàng & Đặt bàn

## 1. Observation (Quan sát thực tế)

Dưới đây là các quan sát trực tiếp từ mã nguồn của dự án (tệp tin, dòng code, nội dung cụ thể):

* **Quan sát 1 (Lỗi `ReferenceError` trong `cartStore.js`)**:
  * **Đường dẫn**: `d:\Web Nhà Hàng\frontend\src\store\cartStore.js`
  * **Dòng**: 130-141
  * **Mã nguồn**:
    ```javascript
    updateNote: (menuItemId, oldNote = '', newNote = '') => {
      const state = get();
      const itemExistsWithNewNote = state.items.some(
        (i) => i.menuItem._id === menuItemId && i.note === newNote && i.variant === variant
      );
    ```
    *Nhận xét*: Tham số của hàm chỉ có `(menuItemId, oldNote = '', newNote = '')`. Biến `variant` ở dòng 133 không tồn tại trong scope.

* **Quan sát 2 (Lệch tham số trong `updateQuantity` và `removeItem`)**:
  * **Đường dẫn**: `d:\Web Nhà Hàng\frontend\src\pages\customer\CartPage.jsx` dòng 307 và `d:\Web Nhà Hàng\frontend\src\store\cartStore.js` dòng 108.
  * **Mã nguồn `CartPage.jsx`**:
    ```jsx
    updateQuantity(item.menuItem._id, item.note, item.variant, item.quantity - 1)
    ```
  * **Mã nguồn `cartStore.js`**:
    ```javascript
    updateQuantity: (menuItemId, note = '', quantity) => {
    ```
    *Nhận xét*: Tham số thứ 3 được truyền là `item.variant` (chuỗi), được gán cho tham số `quantity` của hàm.

* **Quan sát 3 (Thiếu trường `variant` trong Schema `Cart` và `Order`)**:
  * **Đường dẫn**: `d:\Web Nhà Hàng\backend\src\models\Cart.model.js` dòng 3-8 và `d:\Web Nhà Hàng\backend\src\models\Order.model.js` dòng 3-13.
  * **Mã nguồn `Cart.model.js`**:
    ```javascript
    const cartItemSchema = new mongoose.Schema({
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
      quantity: { type: Number, required: true, min: 1 },
      price:    { type: Number, required: true },
      note:     { type: String, default: '' },
    }, { _id: false });
    ```
    *Nhận xét*: Không có trường `variant` trong cấu trúc của một món ăn trong giỏ hàng và đơn hàng, mặc dù `Reservation.model.js` có trường này.

* **Quan sát 4 (Bỏ qua ghi chú và biến thể khi chuyển từ Cart sang Đặt bàn)**:
  * **Đường dẫn**: `d:\Web Nhà Hàng\frontend\src\pages\customer\ReservationPage.jsx` dòng 99-110 và dòng 202-206.
  * **Mã nguồn khởi tạo `preOrderItems`**:
    ```javascript
    cartItems.forEach(item => {
      if (initialItems[item.menuItem._id]) {
        initialItems[item.menuItem._id].quantity += item.quantity;
      } else {
        initialItems[item.menuItem._id] = { menuItem: item.menuItem, quantity: item.quantity };
      }
    });
    ```
  * **Mã nguồn tạo payload đặt bàn (`handleSubmit`)**:
    ```javascript
    const itemsPayload = Object.values(preOrderItems).map(i => ({
      menuItem: i.menuItem._id,
      quantity: i.quantity,
      price: i.menuItem.price
    }));
    ```

* **Quan sát 5 (Sai lệch múi giờ kiểm tra bàn trống)**:
  * **Đường dẫn**: `d:\Web Nhà Hàng\backend\src\services\table.service.js` dòng 31-35.
  * **Mã nguồn**:
    ```javascript
    reservationDate: {
      $gte: new Date(`${date}T00:00:00`),
      $lte: new Date(`${date}T23:59:59`)
    }
    ```

* **Quan sát 6 (Không giải phóng bàn ăn khi Đặt bàn bị hủy)**:
  * **Đường dẫn**: `d:\Web Nhà Hàng\backend\src\services\reservation.service.js` dòng 50.
  * **Mã nguồn**: Hàm `updateStatus` chỉ xử lý trạng thái `da_xac_nhan` (gán bàn) và `da_den` (tạo đơn hàng). Không có logic giải phóng bàn khi `status === 'da_huy'`.

* **Quan sát 7 (Không lưu `currentOrder` cho bàn khi khách đến check-in)**:
  * **Đường dẫn**: `d:\Web Nhà Hàng\backend\src\services\reservation.service.js` dòng 128-134.
  * **Mã nguồn**:
    ```javascript
    TableRepository.updateById(assignedTableId, { status: 'dang_phuc_vu' }, (err) => { ... })
    ```
    *Nhận xét*: Chỉ cập nhật `status: 'dang_phuc_vu'`, không cập nhật `currentOrder` của bàn ăn bằng ID của đơn hàng vừa tạo (`newOrder._id`).

---

## 2. Logic Chain (Chuỗi lập luận)

Từ các quan sát thực tế ở trên, chúng tôi xây dựng chuỗi lập luận dẫn đến các kết luận sau:

1. **Từ Quan sát 1**: Khi khách hàng thay đổi ghi chú của một món ăn trên trang giỏ hàng, hàm `updateNote` được kích hoạt. Trình duyệt cố gắng tìm kiếm biến `variant` trong phạm vi hàm nhưng không thấy -> Trình duyệt ném lỗi `ReferenceError` -> Gây crash UI giỏ hàng -> Người dùng không thể đặt món.
2. **Từ Quan sát 2**: Hàm `updateQuantity` của store nhận chuỗi biến thể (ví dụ: `"Ít cay"`) thay vì số lượng mới -> Thực hiện phép so sánh không hợp lệ -> Số lượng món trong giỏ hàng bị gán thành kiểu chuỗi -> Lỗi tính tổng tiền hoặc lỗi hiển thị trên UI.
3. **Từ Quan sát 3, 4, 5**: Hệ thống cho phép người dùng tùy chỉnh món ăn (ghi chú, biến thể) trong giỏ hàng, nhưng khi chuyển qua trang đặt bàn (`/reservation`), hệ thống gộp các món ăn trùng ID và bỏ qua ghi chú/biến thể. Payload gửi lên API cũng không chứa các trường này -> Khi lưu vào DB, thông tin món ăn đặt trước bị mất toàn bộ tuỳ biến -> Nhân viên chuẩn bị sai món ăn.
4. **Từ Quan sát 6**: Khi đặt bàn bị hủy (`da_huy`), Mongoose cập nhật trạng thái đơn đặt bàn thành `'da_huy'` nhưng không chạm tới bảng `Table` -> Bàn ăn vẫn bị khóa ở trạng thái `dat_truoc` vĩnh viễn trên sơ đồ bàn -> Gây lỗi vận hành nhà hàng.
5. **Từ Quan sát 7**: Khi check-in lịch đặt bàn, hệ thống tạo đơn hàng (`Order`) thành công nhưng không ghi nhận `currentOrder` vào bàn ăn -> Sơ đồ bàn của nhân viên POS hiển thị bàn là "đang phục vụ" nhưng không thể mở đơn hàng để xem chi tiết, thêm món hoặc tính tiền -> Trực tiếp làm gián đoạn quy trình thanh toán.

---

## 3. Caveats (Lưu ý & Giới hạn điều tra)

* Chúng tôi chưa thực hiện chạy thử hệ thống trực tiếp (do đây là phiên điều tra Đọc-Ghi báo cáo - Read-only investigation).
* Giả định rằng hệ thống thanh toán VNPay hoặc các phần bảo mật chưa được tích hợp trực tiếp vào luồng đặt bàn này mà chỉ chạy thông qua đơn hàng (Order) sau khi check-in.
* Chưa kiểm tra kỹ sự ảnh hưởng của Socket.IO đối với client khi bàn chuyển sang `dang_phuc_vu` nhưng `currentOrder` bằng `null`. Khả năng cao client sẽ báo lỗi `cannot read property of null` khi nhân viên cố gắng xem đơn hàng của bàn đó.

---

## 4. Conclusion & Optimization Proposals (Kết luận & Đề xuất tối ưu hóa)

### A. Đề xuất Refactor Store Giỏ hàng (`cartStore.js`)
Cần cập nhật các hàm trong `cartStore.js` để hỗ trợ đầy đủ tham số `variant`. Các hàm phải tuân thủ nghiêm ngặt quy định viết **Arrow Function** của `AGENTS.md`.

#### Mã đề xuất sửa đổi trong `cartStore.js`:
```javascript
  // 1. Hỗ trợ variant khi thêm món ăn
  addItem: (menuItem, quantity = 1, note = '', variant = null) => {
    const state = get();
    const existingIndex = state.items.findIndex(
      (i) => i.menuItem._id === menuItem._id && i.note === note && i.variant === variant
    );

    let newItems = [...state.items];
    if (existingIndex >= 0) {
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + quantity
      };
    } else {
      newItems.push({ menuItem, quantity, price: menuItem.price, note, variant });
    }

    set({ items: newItems });
    if (get().voucherCode) {
      get().removeVoucher();
      toast('Giỏ hàng đã thay đổi, vui lòng áp dụng lại mã giảm giá', { icon: '⚠️' });
    }
    get().syncCart();
  },

  // 2. Hỗ trợ variant khi xóa món ăn
  removeItem: (menuItemId, note = '', variant = null) => {
    const state = get();
    const newItems = state.items.filter(
      (i) => !(i.menuItem._id === menuItemId && i.note === note && i.variant === variant)
    );
    set({ items: newItems });
    if (get().voucherCode) {
      get().removeVoucher();
      toast('Giỏ hàng đã thay đổi, vui lòng áp dụng lại mã giảm giá', { icon: '⚠️' });
    }
    get().syncCart();
  },

  // 3. Sửa lỗi gán sai tham số quantity và lọc theo variant
  updateQuantity: (menuItemId, note = '', variant = null, quantity) => {
    const state = get();
    let newItems = [];
    if (quantity <= 0) {
      newItems = state.items.filter(
        (i) => !(i.menuItem._id === menuItemId && i.note === note && i.variant === variant)
      );
    } else {
      newItems = state.items.map((i) =>
        i.menuItem._id === menuItemId && i.note === note && i.variant === variant
          ? { ...i, quantity }
          : i
      );
    }
    set({ items: newItems });
    if (get().voucherCode) {
      get().removeVoucher();
      toast('Giỏ hàng đã thay đổi, vui lòng áp dụng lại mã giảm giá', { icon: '⚠️' });
    }
    get().syncCart();
  },

  // 4. Sửa lỗi ReferenceError: variant is not defined
  updateNote: (menuItemId, oldNote = '', newNote = '', variant = null) => {
    const state = get();
    const itemExistsWithNewNote = state.items.some(
      (i) => i.menuItem._id === menuItemId && i.note === newNote && i.variant === variant
    );

    let newItems = [];
    if (itemExistsWithNewNote && oldNote !== newNote) {
      const itemToUpdate = state.items.find(
        (i) => i.menuItem._id === menuItemId && i.note === oldNote && i.variant === variant
      );
      if (itemToUpdate) {
        newItems = state.items
          .map((i) => {
            if (i.menuItem._id === menuItemId && i.note === newNote && i.variant === variant) {
              return { ...i, quantity: i.quantity + itemToUpdate.quantity };
            }
            return i;
          })
          .filter(
            (i) => !(i.menuItem._id === menuItemId && i.note === oldNote && i.variant === variant)
          );
      } else {
        newItems = state.items;
      }
    } else {
      newItems = state.items.map((i) =>
        i.menuItem._id === menuItemId && i.note === oldNote && i.variant === variant
          ? { ...i, note: newNote }
          : i
      );
    }

    set({ items: newItems });
    get().syncCart();
  },
```

### B. Đề xuất Refactor luồng Đặt bàn phía Frontend (`ReservationPage.jsx`)
Cần giữ lại đầy đủ `note` và `variant` khi chuyển đổi từ giỏ hàng sang danh sách đặt trước.

#### Sửa đổi khởi tạo `preOrderItems` (dòng 99-110):
```javascript
  const [preOrderItems, setPreOrderItems] = useState(() => {
    const cartItems = useCartStore.getState().items;
    const initialItems = {};
    cartItems.forEach((item, index) => {
      // Dùng key kết hợp ID + note + variant để tránh gộp sai các món tùy chỉnh khác nhau
      const uniqueKey = `${item.menuItem._id}-${item.variant || 'default'}-${item.note || 'default'}`;
      initialItems[uniqueKey] = {
        menuItem: item.menuItem,
        quantity: item.quantity,
        note: item.note || '',
        variant: item.variant || null
      };
    });
    return initialItems;
  });
```

#### Sửa đổi payload submit Đặt bàn (dòng 202-206):
```javascript
      const itemsPayload = Object.values(preOrderItems).map(i => ({
        menuItem: i.menuItem._id,
        quantity: i.quantity,
        price: i.menuItem.price,
        note: i.note,
        variant: i.variant
      }));
```

#### Pre-fill thông tin cá nhân của người dùng đã đăng nhập:
```javascript
  import useAuth from '../../hooks/useAuth'; // Thêm import ở đầu file

  const { user } = useAuth();
  
  // Tự động điền khi user thay đổi
  useEffect(() => {
    if (user) {
      setFormData(f => ({
        ...f,
        customerName: user.name || '',
        customerPhone: user.phone || ''
      }));
    }
  }, [user]);
```

### C. Đề xuất Refactor luồng Đặt bàn phía Backend (`reservation.service.js`)
Sửa lỗi giải phóng bàn khi hủy đặt bàn và lưu `currentOrder` khi check-in khách đến.

#### Sửa đổi hàm `updateStatus` (dòng 113-186):
```javascript
  // 1. Tự động tạo Order khi check-in (da_den) và gán currentOrder vào bàn ăn
  if (status === 'da_den') {
    const currentRes = await new Promise((resolve, reject) => {
      ReservationRepository.findById(id, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });

    if (!currentRes) throw new AppError('Không tìm thấy đơn đặt bàn', 404);
    
    const assignedTableId = tableId || currentRes.table;
    if (assignedTableId) {
       updateData.table = assignedTableId;
       
       let newOrderId = null;
       
       // Nếu có gọi món trước thì tạo Order
       if (currentRes.items && currentRes.items.length > 0) {
          const totalAmount = currentRes.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          const orderItems = currentRes.items.map(i => ({
             menuItem: i.menuItem,
             quantity: i.quantity,
             price: i.price,
             status: 'cho_xac_nhan',
             note: i.note,
             variant: i.variant // Bảo toàn biến thể món ăn
          }));

          const newOrder = await new Promise((resolve, reject) => {
            OrderRepository.create({
               user: currentRes.user || null,
               table: assignedTableId,
               orderType: 'tai_ban',
               items: orderItems,
               totalAmount,
               finalAmount: totalAmount,
               orderStatus: 'cho_xac_nhan',
               paymentMethod: 'tien_mat',
               isPaid: false
            }, (err, doc) => {
               if (err) return reject(err);
               resolve(doc);
            });
          });

          newOrderId = newOrder._id;

          // Fetch full order for socket payload
          const fullOrder = await new Promise((resolve, reject) => {
             OrderRepository.findById(newOrderId, (err, doc) => {
               if (err) return reject(err);
               resolve(doc);
             });
          });
          
          const io = getIO();
          if (io && fullOrder) {
             io.of('/staff').emit('order:new', fullOrder);
             io.of('/kitchen').emit('order:new', fullOrder);
          }
       }
       
       // Cập nhật trạng thái bàn thành đang phục vụ và gán currentOrder
       await new Promise((resolve, reject) => {
         TableRepository.updateById(assignedTableId, { 
           status: 'dang_phuc_vu',
           currentOrder: newOrderId // LIÊN KẾT ĐƠN HÀNG VỚI BÀN ĂN
         }, (err) => {
           if (err) return reject(err);
           resolve();
         });
       });
       
       const io = getIO();
       if (io) {
          io.of('/staff').emit('table:status-changed');
       }
    }
  }

  // 2. Logic giải phóng bàn khi đơn đặt bàn bị hủy (da_huy)
  if (status === 'da_huy') {
    const currentRes = await new Promise((resolve, reject) => {
      ReservationRepository.findById(id, (err, doc) => {
        if (err) return reject(err);
        resolve(doc);
      });
    });

    if (currentRes && currentRes.table) {
      // Trả lại trạng thái bàn ăn là 'trong' nếu bàn đó đang được giữ cho lịch đặt này
      await new Promise((resolve, reject) => {
        TableRepository.updateById(currentRes.table, { status: 'trong' }, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      
      const io = getIO();
      if (io) {
        io.of('/staff').emit('table:status-changed');
      }
    }
  }
```

### D. Đề xuất Đồng bộ Schema Database
- Cần bổ sung thêm trường `variant` vào schema `Cart` và `Order` trên Backend:
  ```javascript
  // Trong src/models/Cart.model.js và src/models/Order.model.js
  variant: { type: String, default: null }
  ```

---

## 5. Verification Method (Phương pháp xác minh)

Để kiểm chứng các đề xuất trên và phát hiện lỗi độc lập, lập trình viên tiếp nhận (implementer) có thể thực hiện theo các bước sau:

1. **Kiểm tra Lỗi Cú pháp & Tải trang**:
   - Khởi động server backend và frontend: `npm run dev` ở cả hai thư mục.
   - Thêm món ăn vào giỏ hàng từ trang thực đơn `/menu`.
   - Mở Console của Trình duyệt (F12) -> Vào trang Giỏ hàng -> Nhấp sửa ghi chú của món ăn bất kỳ -> Xác nhận không có lỗi `ReferenceError` hiển thị và ghi chú được lưu đúng.

2. **Kiểm tra Tích hợp luồng Đặt món trước**:
   - Thêm các món ăn có kèm ghi chú/lựa chọn vào giỏ hàng.
   - Click "Dùng giỏ này Đặt Bàn". Điền thông tin đặt bàn tại `/reservation`.
   - Kiểm tra tại Bước 3 và Bước 4 xem các món ăn có hiển thị đúng ghi chú đi kèm không.
   - Thực hiện gửi đơn đặt bàn và kiểm tra trong database (MongoDB Atlas hoặc Compass): xem bản ghi trong Collection `reservations` có chứa mảng `items` đầy đủ các trường `variant` và `note` không.

3. **Chạy các Integration Test tự động**:
   - Chạy lệnh test trên backend:
     ```powershell
     cd backend
     npm run test
     ```
     *(Yêu cầu bộ kiểm thử Jest phải bao phủ luồng thay đổi trạng thái đặt bàn).*
