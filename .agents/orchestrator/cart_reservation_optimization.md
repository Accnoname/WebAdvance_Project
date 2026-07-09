# Báo cáo Đánh giá & Đề xuất Tối ưu hóa Luồng tích hợp Giỏ hàng và Đặt bàn

## 1. Phân tích hiện trạng luồng dữ liệu & Trải nghiệm UI (Current State Analysis)

Hệ thống hiện tại tích hợp giỏ hàng trực tuyến (Cart) với chức năng đặt bàn kèm gọi món trước (Table Reservation with Pre-order). Quy trình tổng quan bao gồm các bước sau:
1. **Khách hàng** duyệt thực đơn và thêm món ăn vào giỏ hàng (`CartPage.jsx` và `cartStore.js`).
2. **Khách hàng** nhấn nút **"Dùng giỏ này Đặt Bàn"** để chuyển hướng sang trang đặt bàn (`ReservationPage.jsx`).
3. Trang đặt bàn trích xuất dữ liệu từ `cartStore` để điền vào danh sách các món ăn đặt trước (Pre-order items).
4. Khi khách hàng nhấn gửi yêu cầu đặt bàn (`handleSubmit`), hệ thống gửi dữ liệu thông tin cá nhân kèm theo danh sách món ăn đã chọn lên Backend.
5. **Backend** (`reservation.service.js`) thực hiện kiểm tra lịch trùng, lưu đơn đặt bàn vào MongoDB và trả về kết quả thành công. Khi khách hàng check-in (`status === 'da_den'`), hệ thống tự động tạo một đơn hàng (`Order`) tương ứng từ danh sách món ăn đặt trước và phân phối xuống Bếp.

Tuy nhiên, qua quá trình rà soát và đối chiếu mã nguồn, chúng tôi đã phát hiện nhiều lỗi logic, rủi ro bất đồng bộ trạng thái dữ liệu và điểm nghẽn trải nghiệm người dùng nghiêm trọng.

---

## 2. Các vấn đề & Điểm nghẽn phát hiện (Issues & Bottlenecks)

Chúng tôi đã phân tích và phân nhóm thành **11 vấn đề nghiêm trọng** dưới đây:

### Vấn đề 1: Lỗi crash ứng dụng `ReferenceError: variant is not defined`
*   **Vị trí**: `frontend/src/store/cartStore.js` (dòng 130-141)
*   **Mô tả**: Trong hàm `updateNote`, hệ thống thực hiện kiểm tra các sản phẩm trùng lặp có cùng ghi chú bằng cách so sánh `i.variant === variant`. Tuy nhiên, biến `variant` hoàn toàn không có trong danh sách tham số truyền vào hàm `updateNote`.
*   **Mã nguồn hiện tại**:
    ```javascript
    updateNote: (menuItemId, oldNote = '', newNote = '') => {
      const state = get();
      const itemExistsWithNewNote = state.items.some(
        (i) => i.menuItem._id === menuItemId && i.note === newNote && i.variant === variant
      );
    ```
*   **Hệ quả**: Ngay khi khách hàng thay đổi ghi chú của một món ăn trên giao diện giỏ hàng (`CartPage.jsx`), ứng dụng sẽ crash toàn bộ giao diện và ném lỗi `ReferenceError: variant is not defined` trong console trình duyệt.

### Vấn đề 2: Lệch tham số (Parameter Mismatch) phá hủy cấu trúc số lượng giỏ hàng
*   **Vị trí**: `frontend/src/pages/customer/CartPage.jsx` (dòng 307 & 316) đối chiếu với `frontend/src/store/cartStore.js` (dòng 108)
*   **Mô tả**: Tại trang giỏ hàng, các nút tăng/giảm số lượng gọi hàm `updateQuantity` với 4 tham số: `(menuItemId, note, variant, quantity)`. Tuy nhiên, trong store, chữ ký hàm `updateQuantity` chỉ nhận 3 tham số: `(menuItemId, note, quantity)`.
*   **Mã nguồn hiện tại**:
    - Call-site (`CartPage.jsx`):
      ```jsx
      onClick={() => updateQuantity(item.menuItem._id, item.note, item.variant, item.quantity - 1)}
      ```
    - Function Signature (`cartStore.js`):
      ```javascript
      updateQuantity: (menuItemId, note = '', quantity) => { ... }
      ```
*   **Hệ quả**: Tham số thứ 3 được truyền là `item.variant` (ví dụ: chuỗi `"Ít cay"`) sẽ được gán cho tham số `quantity` trong store. Biểu thức so sánh `"Ít cay" <= 0` trả về `false`, khiến hệ thống cập nhật số lượng món ăn thành giá trị chuỗi thay vì số nguyên, dẫn đến lỗi tính tổng tiền hoặc hiển thị sai lệch trên giao diện.
*   *Lỗi tương tự xảy ra với hàm `removeItem` khi `CartPage.jsx` truyền 3 tham số nhưng store chỉ nhận 2 tham số, dẫn đến xóa nhầm toàn bộ món ăn có cùng ID nhưng khác biến thể.*

### Vấn đề 3: Thiếu đồng bộ biến thể món ăn (`variant`) trong DB Schema
*   **Vị trí**: `backend/src/models/Cart.model.js` và `backend/src/models/Order.model.js`
*   **Mô tả**: Trong khi mô hình đặt bàn (`Reservation.model.js`) đã được thiết kế hỗ trợ trường `variant` (biến thể món ăn), các mô hình dữ liệu của giỏ hàng (`Cart.model.js`) và đơn hàng (`Order.model.js`) lại hoàn toàn bỏ sót trường này.
*   **Hệ quả**: Bất kỳ thông tin cấu hình biến thể nào được gửi từ khách hàng cũng không thể lưu trữ lâu dài dưới DB, gây mất thông tin ngay khi giỏ hàng được đồng bộ từ local store lên server.

### Vấn đề 4: Mất ghi chú và biến thể món ăn khi chuyển sang trang Đặt bàn (Data Truncation)
*   **Vị trí**: `frontend/src/pages/customer/ReservationPage.jsx` (dòng 99-110)
*   **Mô tả**: Trang đặt bàn khởi tạo danh sách món ăn đặt trước (`preOrderItems`) bằng cách gộp các sản phẩm từ giỏ hàng dựa trên ID món ăn (`item.menuItem._id`), đồng thời lược bỏ hoàn toàn các thuộc tính riêng biệt như `note` và `variant`.
*   **Mã nguồn hiện tại**:
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
*   **Hệ quả**: Nếu một khách hàng chọn 2 ly Trà sữa (1 ly "Không đá", 1 ly "Ít đường") trong giỏ hàng, khi chuyển sang trang Đặt bàn, hệ thống sẽ gộp thành 2 ly Trà sữa trơn và xóa sạch mọi yêu cầu riêng biệt của khách hàng.

### Vấn đề 5: Submit đơn đặt bàn lược bỏ hoàn toàn ghi chú và biến thể món ăn
*   **Vị trí**: `frontend/src/pages/customer/ReservationPage.jsx` (dòng 202-206)
*   **Mô tả**: Payload gửi từ Client lên API đặt bàn bỏ qua các thuộc tính tùy chỉnh của từng món ăn.
*   **Mã nguồn hiện tại**:
    ```javascript
    const itemsPayload = Object.values(preOrderItems).map(i => ({
      menuItem: i.menuItem._id,
      quantity: i.quantity,
      price: i.menuItem.price
    }));
    ```
*   **Hệ quả**: Ngay cả khi dữ liệu thô ban đầu có chứa biến thể và ghi chú, cấu trúc request này sẽ ép kiểu và loại bỏ chúng trước khi gửi lên API, dẫn đến việc trường `items` trong lịch đặt bàn trên cơ sở dữ liệu luôn trống rỗng các thông tin tuỳ chỉnh.

### Vấn đề 6: Trùng lịch và lệch múi giờ (Timezone Inconsistency) khi kiểm tra bàn trống
*   **Vị trí**: `backend/src/services/table.service.js` (dòng 31-35) so với `backend/src/services/reservation.service.js` (dòng 19)
*   **Mô tả**:
    - Khi đặt bàn, backend lưu ngày dạng `Date` theo thời gian UTC không giờ (`data.reservationDate = new Date('2026-07-09')` -> `2026-07-09T00:00:00Z`).
    - Khi kiểm tra tính khả dụng của bàn, service lại dựng ngày so sánh dựa trên chuỗi cục bộ của server (`new Date(`${date}T00:00:00`)`).
*   **Hệ quả**: Sự chênh lệch múi giờ giữa máy chủ và định dạng UTC có thể làm dịch chuyển thời gian sang ngày hôm trước hoặc hôm sau, khiến hệ thống bỏ sót các lịch đặt đã tồn tại, dẫn đến việc chấp nhận hai đơn đặt bàn trùng nhau trên cùng một bàn vào một thời điểm (Double Booking).

### Vấn đề 7: Bàn ăn bị khóa vĩnh viễn khi đơn đặt bàn bị hủy (`da_huy`)
*   **Vị trí**: `backend/src/services/reservation.service.js` (trong hàm `updateStatus`)
*   **Mô tả**: Khi chuyển đổi trạng thái đặt bàn sang `'da_huy'`, service cập nhật trạng thái đơn đặt bàn nhưng không thực hiện hoàn trả trạng thái bàn liên kết (`Table`) về `'trong'`.
*   **Hệ quả**: Bàn ăn liên kết bị khóa ở trạng thái `'dat_truoc'` vĩnh viễn trên sơ đồ bàn, gây thiệt hại doanh thu thực tế cho nhà hàng do nhân viên không thể xếp khách mới vào bàn đó.

### Vấn đề 8: Mất liên kết giữa Sơ đồ bàn ăn và Đơn hàng khi check-in khách đến (`da_den`)
*   **Vị trí**: `backend/src/services/reservation.service.js` (dòng 128-134)
*   **Mô tả**: Khi khách đặt bàn đến nhận bàn, hệ thống tự động đổi trạng thái bàn thành `'dang_phuc_vu'` và tạo đơn hàng mới (`Order`). Tuy nhiên, trường `currentOrder` của bàn ăn liên kết không được gán ID của đơn hàng vừa được tạo.
*   **Mã nguồn hiện tại**:
    ```javascript
    await new Promise((resolve, reject) => {
      TableRepository.updateById(assignedTableId, { status: 'dang_phuc_vu' }, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    ```
*   **Hệ quả**: Trên sơ đồ bàn của nhân viên POS, bàn ăn hiển thị màu đỏ báo "Đang phục vụ" nhưng trường `currentOrder` trống. Khi nhân viên click vào bàn này để thêm món hoặc thanh toán, ứng dụng sẽ báo lỗi hoặc không hiển thị hóa đơn hiện tại, làm gián đoạn nghiêm trọng luồng vận hành của nhà hàng.

### Vấn đề 9: Bỏ qua tầng nghiệp vụ dịch vụ (Service Layer) khi tự động khởi tạo Đơn hàng
*   **Vị trí**: `backend/src/services/reservation.service.js` (dòng 155-170)
*   **Mô tả**: Service tự tạo Order bằng cách gọi trực tiếp `OrderRepository.create` thay vì thông qua `OrderService.create`.
*   **Hệ quả**: Bỏ qua các bước xác thực nghiệp vụ thiết yếu như: kiểm tra món ăn có còn khả dụng hay không (`isAvailable`), kiểm tra các quy định khuyến mãi, hoặc ghi log hoạt động đơn hàng.

### Vấn đề 10: Mất thông tin Voucher/Khuyến mãi khi chuyển sang Đặt bàn
*   **Vị trí**: `frontend/src/store/cartStore.js` và `frontend/src/pages/customer/ReservationPage.jsx`
*   **Mô tả**: Khách hàng áp mã giảm giá thành công trong giỏ hàng (`voucherCode`, `discountAmount`). Nhưng khi chuyển qua trang đặt bàn, hệ thống không lưu giữ thông tin này vì Schema đặt bàn hiện tại không hỗ trợ thông tin voucher.
*   **Hệ quả**: Làm giảm trải nghiệm khách hàng khi họ kỳ vọng được giảm giá cho đơn món đặt trước nhưng hóa đơn khi đến quán lại tính theo giá gốc.

### Vấn đề 11: Trải nghiệm nhập liệu trùng lặp (Redundant Input) gây phiền hà cho người dùng
*   **Vị trí**: `frontend/src/pages/customer/ReservationPage.jsx` (Bước 4)
*   **Mô tả**: Khách hàng đã đăng nhập tài khoản hệ thống nhưng khi tới bước xác nhận đặt bàn vẫn phải nhập lại thủ công `Họ tên` và `Số điện thoại`.
*   **Hệ quả**: Tăng số lượng thao tác click chuột và nhập văn bản không đáng có, làm giảm tỷ lệ chuyển đổi đơn đặt bàn trực tuyến.

---

## 3. Giải pháp đề xuất & Code mẫu (Proposed Optimizations & Sample Code)

Để giải quyết triệt để 11 vấn đề nêu trên, chúng tôi đề xuất phương án tối ưu hóa toàn diện theo đúng quy tắc và tiêu chuẩn coding của dự án quy định trong `AGENTS.md` (chỉ sử dụng **Arrow Function**, **try/catch** đầy đủ, dùng **error-first callbacks** ở tầng repository, và đảm bảo an toàn nghiệp vụ):

### Đề xuất 1: Đồng bộ hóa Database Schema (Bổ sung trường `variant`)
Bổ sung trường `variant` vào schema trong các file model để lưu trữ thông tin biến thể:

*   **File: `backend/src/models/Cart.model.js`**
    ```javascript
    // Cập nhật cartItemSchema
    const cartItemSchema = new mongoose.Schema({
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
      quantity: { type: Number, required: true, min: 1 },
      price:    { type: Number, required: true },
      note:     { type: String, default: '' },
      variant:  { type: String, default: null } // Bổ sung
    }, { _id: false });
    ```
*   **File: `backend/src/models/Order.model.js`**
    ```javascript
    // Cập nhật orderItemSchema
    const orderItemSchema = new mongoose.Schema({
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
      quantity: { type: Number, required: true, min: 1 },
      price:    { type: Number, required: true },
      note:     { type: String, default: '' },
      variant:  { type: String, default: null }, // Bổ sung
      status:   {
        type: String,
        enum: ['cho_xac_nhan', 'dang_che_bien', 'cho_phuc_vu', 'hoan_thanh', 'huy'],
        default: 'cho_xac_nhan'
      }
    });
    ```

---

### Đề xuất 2: Sửa lỗi cú pháp và lệch tham số trong `cartStore.js`
Cập nhật store giỏ hàng để các hàm so sánh, cập nhật, và xóa sản phẩm nhận biết chính xác trường `variant` được truyền từ client:

*   **File: `frontend/src/store/cartStore.js`**
    ```javascript
    const useCartStore = create((set, get) => ({
      // ... state khác giữ nguyên ...

      // 1. Thêm sản phẩm có hỗ trợ variant
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

      // 2. Xóa sản phẩm phân biệt rõ theo variant
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

      // 3. Cập nhật số lượng sửa lỗi gán sai tham số và so sánh variant
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

      // 4. Hàm updateNote sửa lỗi ReferenceError
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
      }
    }));
    ```

---

### Đề xuất 3: Khắc phục việc gộp món mất tùy biến và tự điền thông tin trong `ReservationPage.jsx`
*   **Tránh gộp món sai lệch**: Tạo khóa duy nhất `uniqueKey` từ sự kết hợp của `ID món + Biến thể + Ghi chú` để phân biệt các tùy chọn.
*   **Tự động điền dữ liệu (UX)**: Đọc thông tin từ store đăng nhập hệ thống (`useAuth`) để tự điền vào thông tin cá nhân khách đặt bàn.

*   **File: `frontend/src/pages/customer/ReservationPage.jsx`**
    ```jsx
    import useAuth from '../../hooks/useAuth'; // Bổ sung import ở đầu file

    // Trong component ReservationPage:
    const { user } = useAuth();

    // 1. Tự động điền thông tin cá nhân khi user đã đăng nhập
    useEffect(() => {
      if (user) {
        setFormData((prevData) => ({
          ...prevData,
          customerName: user.name || '',
          customerPhone: user.phone || ''
        }));
      }
    }, [user]);

    // 2. Sửa đổi khởi tạo preOrderItems sử dụng uniqueKey kết hợp
    const [preOrderItems, setPreOrderItems] = useState(() => {
      const cartItems = useCartStore.getState().items;
      const initialItems = {};
      cartItems.forEach((item) => {
        // Tạo khóa định danh duy nhất chứa đầy đủ variant và note
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

    // 3. Cập nhật hàm thay đổi số lượng preOrderItems
    const updatePreOrderQty = (uniqueKey, qty) => {
      setPreOrderItems((prev) => {
        const updated = { ...prev };
        const currentQty = updated[uniqueKey]?.quantity || 0;
        const newQty = Math.max(0, currentQty + qty);
        if (newQty === 0) {
          delete updated[uniqueKey];
        } else {
          updated[uniqueKey] = { ...updated[uniqueKey], quantity: newQty };
        }
        return updated;
      });
    };

    // 4. Bảo toàn note và variant khi submit đơn đặt bàn
    const handleSubmit = async () => {
      setIsSubmitting(true);
      try {
        const itemsPayload = Object.values(preOrderItems).map((i) => ({
          menuItem: i.menuItem._id,
          quantity: i.quantity,
          price: i.menuItem.price,
          note: i.note,
          variant: i.variant
        }));
        
        await ReservationService.create({
          ...formData,
          table: formData.tableId,
          note: buildNote(),
          items: itemsPayload
        });
        
        useCartStore.getState().clearCart();
        setIsSuccess(true);
        toast.success('Đặt bàn thành công!');
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi gửi đơn đặt bàn');
      } finally {
        setIsSubmitting(false);
      }
    };
    ```

---

### Đề xuất 4: Cải tiến logic đồng bộ trạng thái bàn, liên kết đơn hàng, và giải phóng tài nguyên ở Backend
Sửa đổi hàm `updateStatus` trong service đặt bàn để:
1.  Đồng bộ hóa trường `currentOrder` khi check-in khách đến (`da_den`).
2.  Tự động giải phóng trạng thái bàn ăn sang `'trong'` khi lịch đặt bị hủy (`da_huy`).

*   **File: `backend/src/services/reservation.service.js`**
    ```javascript
    const updateStatus = async (id, status, tableId = null) => {
      const updateData = { status };
      
      // A. Nếu xác nhận đặt bàn và gán bàn ngồi
      if (status === 'da_xac_nhan' && tableId) {
        const table = await new Promise((resolve, reject) => {
          TableRepository.findById(tableId, (err, doc) => {
            if (err) return reject(err);
            resolve(doc);
          });
        });

        if (!table) throw new AppError('Bàn không tồn tại', 404);

        const currentRes = await new Promise((resolve, reject) => {
          ReservationRepository.findById(id, (err, doc) => {
            if (err) return reject(err);
            resolve(doc);
          });
        });

        if (!currentRes) throw new AppError('Không tìm thấy đơn đặt bàn', 404);

        // Kiểm tra bàn có bị trùng lịch trong cùng ngày + giờ với lịch đặt khác không
        const conflict = await new Promise((resolve, reject) => {
          const resDate = new Date(currentRes.reservationDate);
          resDate.setUTCHours(0, 0, 0, 0);

          ReservationRepository.findAllWithDetails({
            _id: { $ne: id },
            reservationDate: resDate,
            reservationTime: currentRes.reservationTime,
            status: { $in: ['cho_xac_nhan', 'da_xac_nhan'] },
            table: tableId
          }, (err, docs) => {
            if (err) return reject(err);
            resolve(docs);
          });
        });

        if (conflict && conflict.length > 0) {
          throw new AppError(`Bàn ${table.tableNumber} đã có người đặt vào khung giờ này!`, 409);
        }
        
        updateData.table = tableId;
        
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const isToday = currentRes.reservationDate.getTime() === today.getTime();
        
        if (isToday) {
          await new Promise((resolve, reject) => {
            TableRepository.updateById(tableId, { status: 'dat_truoc' }, (err) => {
              if (err) return reject(err);
              resolve();
            });
          });
        }
      }

      // B. Tự động tạo Order khi check-in khách đến (da_den)
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
          const { getIO } = require('../config/socket');
          const OrderRepository = require('../repositories/order.repository');
          
          // Tạo hóa đơn đặt trước (nếu có chọn món trước)
          if (currentRes.items && currentRes.items.length > 0) {
            const totalAmount = currentRes.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            const orderItems = currentRes.items.map((i) => ({
              menuItem: i.menuItem,
              quantity: i.quantity,
              price: i.price,
              status: 'cho_xac_nhan',
              note: i.note,
              variant: i.variant // Đồng bộ cấu hình biến thể xuống hóa đơn nhà bếp
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

            // Lấy thông tin chi tiết đơn hàng phục vụ Socket IO emit xuống Bếp và Phục vụ
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
          
          // Cập nhật trạng thái bàn thành 'dang_phuc_vu' và LIÊN KẾT currentOrder
          await new Promise((resolve, reject) => {
            TableRepository.updateById(assignedTableId, { 
              status: 'dang_phuc_vu',
              currentOrder: newOrderId // Liên kết chặt chẽ hóa đơn với sơ đồ bàn
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

      // C. Logic tự động giải phóng bàn về 'trong' khi đặt bàn bị hủy (da_huy)
      if (status === 'da_huy') {
        const currentRes = await new Promise((resolve, reject) => {
          ReservationRepository.findById(id, (err, doc) => {
            if (err) return reject(err);
            resolve(doc);
          });
        });

        if (currentRes && currentRes.table) {
          // Hoàn trả trạng thái bàn về 'trong'
          await new Promise((resolve, reject) => {
            TableRepository.updateById(currentRes.table, { 
              status: 'trong',
              currentOrder: null 
            }, (err) => {
              if (err) return reject(err);
              resolve();
            });
          });
          
          const { getIO } = require('../config/socket');
          const io = getIO();
          if (io) {
            io.of('/staff').emit('table:status-changed');
          }
        }
      }

      const updated = await new Promise((resolve, reject) => {
        ReservationRepository.updateById(id, updateData, (err, doc) => {
          if (err) return reject(err);
          resolve(doc);
        });
      });
      if (!updated) throw new AppError('Không tìm thấy đơn đặt bàn', 404);
      return updated;
    };
    ```

---

## 4. Lợi ích mang lại (Value and Benefits)

1.  **Chống sập ứng dụng và mất dữ liệu**: Việc bổ sung biến `variant` vào tham số `updateNote` loại bỏ hoàn toàn lỗi crash trình duyệt, giữ cho giỏ hàng hoạt động mượt mà.
2.  **Đảm bảo tính chính xác của dữ liệu giỏ hàng**: Hàm `updateQuantity` được sửa giúp ngăn chặn tình trạng số lượng biến đổi thành kiểu chuỗi văn bản, loại bỏ các lỗi sai số tiền thanh toán hiển thị trên UI.
3.  **Tôn trọng lựa chọn cá nhân hóa của khách hàng**: Đảm bảo khách hàng nhận đúng loại món ăn, khẩu vị ưa thích (ví dụ: ngọt/nhạt, cay/không cay) từ khâu đặt bàn trước cho tới khi chế biến trong nhà bếp.
4.  **Tối ưu hiệu suất hoạt động và doanh thu nhà hàng**: 
    - Bàn ăn tự động chuyển về trạng thái `'trong'` khi lịch đặt bị hủy, tránh lãng phí chỗ ngồi.
    - Trường `currentOrder` được cập nhật giúp phục vụ mở trực tiếp đơn hàng từ sơ đồ bàn ăn trên POS, thực hiện thêm món hoặc thanh toán trong chớp mắt mà không cần dò tìm hóa đơn thủ công.
5.  **Tăng tỷ lệ hoàn tất đơn đặt bàn**: Việc tự động điền thông tin cá nhân giúp khách hàng tiết kiệm thời gian, tăng trải nghiệm tiện lợi và kích thích họ quay lại đặt bàn trực tuyến.

---

## 5. Kế hoạch xác minh (Verification & Testing Plan)

Lập trình viên sau khi triển khai các cải tiến này cần thực hiện quy trình kiểm thử 3 bước:

1.  **Kiểm thử thủ công trên Frontend (Manual UI Verification)**:
    *   Truy cập `/menu`, cấu hình một món ăn có ghi chú và chọn biến thể (ví dụ: trà sữa - ít đường). Thêm vào giỏ hàng.
    *   Mở `/cart`, chỉnh sửa ghi chú sản phẩm, kiểm tra console trình duyệt để xác nhận không còn lỗi `ReferenceError`.
    *   Bấm chọn tăng/giảm số lượng sản phẩm, kiểm tra số tiền tổng hóa đơn xem có được nhân đúng tỉ lệ số nguyên không.
    *   Bấm "Dùng giỏ này Đặt Bàn", kiểm tra tại màn hình đặt bàn xem 2 sản phẩm trùng ID nhưng khác ghi chú/biến thể có bị gộp thành 1 hay không (đúng thiết kế: phải hiển thị tách biệt).
    *   Kiểm tra xem tên và số điện thoại của tài khoản đang đăng nhập đã được tự động điền hay chưa.

2.  **Kiểm tra tính nhất quán trong Cơ sở dữ liệu (Database Integrity Audit)**:
    *   Hoàn tất đặt đơn bàn kèm gọi món trước.
    *   Dùng MongoDB Compass kiểm tra bản ghi tương ứng trong collection `reservations`:
        - Kiểm tra xem mảng `items` có lưu trữ đúng các trường `variant` (chuỗi) và `note` (ghi chú) hay không.

3.  **Kiểm tra Đồng bộ Quy trình trên sơ đồ bàn (POS & Staff Check-in Flow)**:
    *   Đăng nhập tài khoản nhân viên phục vụ (`nhan_vien`). Truy cập danh sách đặt bàn.
    *   Chọn đơn đặt bàn ở trạng thái `da_xac_nhan`, click cập nhật sang trạng thái `da_den` (Check-in khách đến).
    *   Truy cập Sơ đồ bàn `/staff/tables`. Kiểm tra xem bàn được gán có đổi sang màu đỏ ("Đang phục vụ") hay không.
    *   Click vào bàn đó, kiểm tra xem hệ thống có tải thành công hóa đơn hiện tại có chứa các món đặt trước không (xác minh trường `currentOrder` đã liên kết thành công).
    *   Hủy một đơn đặt bàn đang giữ bàn ngồi, quay lại sơ đồ bàn xác minh bàn đó lập tức chuyển sang trạng thái xanh lá ("Trống").
