# Phân Tích Hệ Thống Xác Thực & Giao Thức Đặt Lại Mật Khẩu (OTP-based Password Reset)

## 🔍 Tóm tắt phát hiện
Luồng đặt lại mật khẩu hiện tại đang sử dụng cơ chế token bảo mật ngẫu nhiên kết hợp OTP, nhưng việc truyền token này về client qua API và React state tạo ra rủi ro lộ lọt thông tin. Chuyển đổi sang luồng xác thực bằng OTP trực tiếp (sử dụng Email + OTP + Mật khẩu mới) sẽ loại bỏ hoàn toàn token trung gian, tăng cường tính bảo mật và đơn giản hóa luồng dữ liệu giữa Client và Server.

---

## 📋 Phân Tích Hiện Trạng Hệ Thống

Dưới đây là tổng hợp các cấu phần hiện tại liên quan đến luồng đặt lại mật khẩu:

| Tên File | Vai trò hiện tại | Vấn đề cần khắc phục / Điểm chú ý |
|---|---|---|
| `backend/src/services/auth.service.js` | Hàm `forgotPassword` tạo ra đồng thời `otp` (6 chữ số) và `resetToken` (32 bytes hex), lưu `resetToken` vào DB (`resetPasswordToken`) và trả cả 2 về client.<br>Hàm `resetPassword` tìm user bằng `resetToken` thông qua UserRepository. | - Cần lưu `otp` trực tiếp vào `resetPasswordToken` thay vì `resetToken`. <br>- Loại bỏ hoàn toàn việc tạo và trả về `resetToken`. <br>- Cập nhật `resetPassword` tìm user bằng `email`, so khớp `otp` và kiểm tra thời gian hết hạn (`resetPasswordExpires`). |
| `backend/src/controllers/auth.controller.js` | Handler `resetPassword` nhận `{ resetToken, newPassword }` từ request body và chuyển cho service. | Cần đổi sang nhận `{ email, otp, newPassword }` từ client. |
| `backend/src/repositories/user.repository.js` | Cung cấp helper `findByEmail` và `findByResetToken`. | Helper `findByResetToken` sẽ không còn được sử dụng nữa, thay vào đó service sẽ tìm kiếm qua `findByEmail`. |
| `backend/src/models/User.model.js` | Định nghĩa schema User chứa `resetPasswordToken` (String) và `resetPasswordExpires` (Date). | Không cần thay đổi Schema vì `resetPasswordToken` là kiểu String, có thể lưu trữ trực tiếp chuỗi OTP 6 số mà không gặp lỗi tương thích. Trường này không có index `unique: true` nên không gây xung đột trùng lặp. |
| `frontend/src/pages/auth/ForgotPasswordPage.jsx` | Gửi yêu cầu quên mật khẩu, nhận về OTP và `resetToken` rồi chuyển tiếp sang `/reset-password` bằng state của React Router. | Cập nhật hàm điều hướng: Không truyền `resetToken` trong state nữa, chỉ truyền `email` (và `otp` để phục vụ chế độ TEST). |
| `frontend/src/pages/auth/ResetPasswordPage.jsx` | Nhận `resetToken` và `otp` từ state của router. Thực hiện kiểm tra nếu thiếu `resetToken` thì redirect về trang quên mật khẩu. Gọi API reset bằng `resetToken`. | - Thay đổi kiểm tra redirect: Redirect nếu thiếu `email` thay vì `resetToken`. <br>- Thêm trường nhập OTP 6 chữ số bắt buộc kèm theo validation số. <br>- Gửi `{ email, otp, newPassword }` khi submit form. |

---

## 💻 Chiến Lược Triển Khai Đề Xuất (Implementation Strategy)

### 1. Cập nhật `backend/src/services/auth.service.js`
Thay đổi logic của hàm `forgotPassword` và `resetPassword`:

```javascript
// Gửi OTP quên mật khẩu — tạo token 6 số, hết hạn sau 15 phút
// File: backend/src/services/auth.service.js (Dòng 117)
const forgotPassword = async (email) => {
  const user = await new Promise((resolve, reject) => {
    UserRepository.findByEmail(email, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  // Trả về thành công dù email không tồn tại (bảo mật — không lộ email)
  if (!user) {
    return { message: 'Nếu email tồn tại, mã OTP đã được gửi' };
  }

  // Tạo OTP 6 số
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Lưu OTP trực tiếp vào resetPasswordToken và đặt hết hạn sau 15 phút
  user.resetPasswordToken = otp;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phút
  await user.save();

  // TODO: Gửi email thật — hiện tại log ra console để test
  console.log(`\n🔑 [FORGOT PASSWORD] Email: ${email} | OTP: ${otp}\n`);

  // Trả về OTP cho client (chỉ dùng khi chưa có email server)
  return {
    message: 'Mã OTP đã được gửi đến email của bạn',
    otp,          // ⚠️ Chỉ trả về để test — xóa khi production
  };
};

// Đặt lại mật khẩu bằng OTP
// File: backend/src/services/auth.service.js (Dòng 153)
const resetPassword = async (email, otp, newPassword) => {
  if (!email || !otp || !newPassword) {
    throw new AppError('Email, mã OTP và mật khẩu mới không được để trống', 400);
  }
  if (newPassword.length < 6) {
    throw new AppError('Mật khẩu mới phải từ 6 ký tự trở lên', 400);
  }

  const user = await new Promise((resolve, reject) => {
    UserRepository.findByEmail(email, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (!user) {
    throw new AppError('Yêu cầu đặt lại mật khẩu không hợp lệ', 400); // Tránh lộ thông tin email không tồn tại
  }

  // Kiểm tra OTP khớp và còn hạn sử dụng
  if (user.resetPasswordToken !== otp) {
    throw new AppError('Mã OTP không chính xác', 400);
  }

  if (!user.resetPasswordExpires || new Date(user.resetPasswordExpires).getTime() < Date.now()) {
    throw new AppError('Mã OTP đã hết hạn', 400);
  }

  // Hash và lưu mật khẩu mới, xóa OTP
  user.password = await hashPassword(newPassword);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return { message: 'Đặt lại mật khẩu thành công' };
};
```

### 2. Cập nhật `backend/src/controllers/auth.controller.js`
Thay đổi handler `resetPassword` để giải nén đúng các trường tham số:

```javascript
// File: backend/src/controllers/auth.controller.js (Dòng 45)
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await AuthService.resetPassword(email, otp, newPassword);
    res.status(200).json(sendSuccess('Đặt lại mật khẩu thành công', result));
  } catch (error) { next(error); }
};
```

### 3. Cập nhật `frontend/src/pages/auth/ForgotPasswordPage.jsx`
Thay đổi tham số truyền qua React Router State khi gửi thành công email yêu cầu:

```javascript
// File: frontend/src/pages/auth/ForgotPasswordPage.jsx (Dòng 14)
  const onSubmit = async (data) => {
    try {
      const res = await authService.forgotPassword(data.email);
      const result = res.data?.data;
      setSentData(result);
      toast.success('Đã gửi mã OTP! Kiểm tra hộp thư của bạn.');
      // Chuyển sang trang đặt lại mật khẩu, chỉ truyền email và otp (test mode)
      navigate('/reset-password', {
        state: {
          email: data.email,
          // ⚠️ chỉ dùng khi test — otp hiển thị trực tiếp
          otp: result?.otp,
        }
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể gửi mã OTP, vui lòng thử lại');
    }
  };
```

### 4. Cập nhật `frontend/src/pages/auth/ResetPasswordPage.jsx`
Cấu trúc lại trang nhập mật khẩu mới để bắt buộc nhập OTP:

- **Thay đổi state và kiểm tra ban đầu**:
```javascript
// File: frontend/src/pages/auth/ResetPasswordPage.jsx (Dòng 15)
  // Lấy email và otp từ state khi chuyển trang từ ForgotPasswordPage
  const { email, otp } = location.state || {};
  const newPassword = watch('newPassword');

  // Nếu không có email → redirect về forgot-password
  useEffect(() => {
    if (!email) {
      toast.error('Phiên làm việc không hợp lệ. Vui lòng thực hiện lại từ đầu.');
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);
```

- **Thay đổi hàm `onSubmit`**:
```javascript
// File: frontend/src/pages/auth/ResetPasswordPage.jsx (Dòng 27)
  const onSubmit = async (data) => {
    try {
      await authService.resetPassword({
        email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      toast.success('Đặt lại mật khẩu thành công! Hãy đăng nhập lại.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Đặt lại mật khẩu thất bại, vui lòng thử lại');
    }
  };
```

- **Thêm input nhập OTP 6 chữ số vào form JSX**:
Chèn đoạn mã dưới đây vào ngay phía trên trường nhập **Mật khẩu mới** trong thẻ `<form>`:
```jsx
            {/* Mã xác thực OTP */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700 block">
                Mã xác thực OTP
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <ShieldCheck className="h-5 w-5 text-stone-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  id="reset-otp"
                  type="text"
                  maxLength={6}
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none tracking-widest font-mono text-lg"
                  placeholder="123456"
                  {...register('otp', {
                    required: 'Vui lòng nhập mã OTP 6 số',
                    pattern: { value: /^[0-9]{6}$/, message: 'Mã OTP phải gồm 6 chữ số' }
                  })}
                />
              </div>
              {errors.otp && (
                <p className="text-rose-500 text-xs mt-1 font-medium">{errors.otp.message}</p>
              )}
            </div>
```

---

## ⚠️ Các Trường Hợp Đặc Biệt & Rủi Ro Tiềm Ẩn (Edge Cases & Risks)

### 1. Đồng bộ cơ sở dữ liệu (Database Schema / Indices)
- **Tương thích**: `resetPasswordToken` trong Schema User là String, nên việc lưu OTP dạng chuỗi ("123456") là hoàn toàn tương thích.
- **Rủi ro trùng lặp**: Nếu trường `resetPasswordToken` có index `unique: true`, hệ thống sẽ bị lỗi khi có nhiều user có giá trị `null` hoặc sinh ngẫu nhiên trùng mã OTP. Tuy nhiên, qua phân tích `User.model.js`, trường này không có thuộc tính `unique` hay index nào đặc biệt, do đó **không có rủi ro này**.

### 2. Tấn công vét cạn OTP (Brute-Force OTP Attack)
- **Vấn đề**: OTP gồm 6 chữ số chỉ có 1,000,000 khả năng. Nếu không có cơ chế giới hạn tần suất gửi yêu cầu (Rate Limiting) hoặc giới hạn số lần nhập sai OTP, kẻ tấn công có thể thử liên tục để dò tìm mã OTP hợp lệ cho một email cụ thể.
- **Giải pháp khuyến nghị**: 
  - Triển khai middleware `express-rate-limit` cho route `/reset-password` để giới hạn số lần thử (ví dụ: tối đa 5 lần thử sai trong 15 phút đối với một IP hoặc Email).
  - Hoặc thêm trường `otpAttempts` vào Schema User, tăng giá trị mỗi khi nhập sai, nếu vượt quá 3-5 lần thì vô hiệu hóa mã OTP hiện tại.

### 3. F5/Reload trang Đặt lại mật khẩu (State Loss on Reload)
- **Vấn đề**: Khi người dùng nhấn F5 ở trang `/reset-password`, `location.state` sẽ bị xóa và `email` sẽ trở thành `undefined`. Hệ thống sẽ kích hoạt `useEffect` để đẩy người dùng quay về `/forgot-password` kèm thông báo lỗi.
- **Đánh giá**: Đây là hành vi hợp lý về mặt bảo mật để tránh người dùng thao tác trực tiếp trên trang đặt lại mật khẩu mà không qua bước gửi OTP.

### 4. Xử lý múi giờ và so sánh thời gian hết hạn (Timezone & Expiry Comparison)
- **Đánh giá**: MongoDB lưu trữ Date dưới dạng UTC. So sánh `new Date(user.resetPasswordExpires).getTime() < Date.now()` sử dụng dấu thời gian Unix Epoch (milliseconds), độc lập với múi giờ của máy chủ, đảm bảo tính chính xác và đồng bộ trên các môi trường.

---

## ✅ Gợi Ý Kịch Bản Kiểm Thử (Verification Method)

Sau khi triển khai, lập trình viên có thể thực hiện kiểm thử theo các bước sau để xác nhận tính chính xác:

1. **Gửi yêu cầu OTP**:
   - Gửi request `POST /api/v1/auth/forgot-password` với email hợp lệ.
   - Xác nhận response trả về mã OTP (dùng cho test mode) và không còn trường `resetToken`.
   - Xem log console của backend để kiểm tra dòng: `🔑 [FORGOT PASSWORD] Email: ... | OTP: ...`.

2. **Đặt lại mật khẩu thành công**:
   - Gửi request `POST /api/v1/auth/reset-password` với `{ email, otp, newPassword }` chính xác.
   - Xác nhận response trả về HTTP 200 và `"Đặt lại mật khẩu thành công"`.
   - Thử đăng nhập lại bằng email và mật khẩu mới để kiểm tra.

3. **Đặt lại mật khẩu thất bại (Mã OTP sai/hết hạn)**:
   - Gửi request `POST /api/v1/auth/reset-password` với mã OTP sai (ví dụ `"000000"`). Xác nhận lỗi HTTP 400 `"Mã OTP không chính xác"`.
   - Chờ quá 15 phút hoặc chỉnh sửa tay trong MongoDB trường `resetPasswordExpires` về thời gian quá khứ, sau đó gửi lại đúng OTP. Xác nhận lỗi HTTP 400 `"Mã OTP đã hết hạn"`.
