# Phân tích & Đề xuất Giải pháp Bảo mật Luồng Quên/Đặt lại Mật khẩu

Tài liệu này phân tích chi tiết luồng xác thực và quên mật khẩu hiện tại trong hệ thống, đồng thời đề xuất chiến lược triển khai chi tiết cho các bản vá bảo mật nhằm thay thế cơ chế `resetToken` bằng việc kiểm tra mã OTP trực tiếp từ phía Backend và cập nhật giao diện người dùng tương ứng.

---

## 1. Phân tích hiện trạng codebase

### 1.1. Backend Service (`backend/src/services/auth.service.js`)
* **`forgotPassword(email)`**: 
  - Tạo OTP 6 chữ số (`otp`) và một token ngẫu nhiên 32-byte (`resetToken`).
  - Lưu `resetToken` vào DB (`user.resetPasswordToken`) thay vì lưu mã OTP.
  - Trả về cả `otp` và `resetToken` cho client (ở chế độ test).
  - *Lỗ hổng/Bất hợp lý*: Việc Backend sinh ra một `resetToken` và chuyển tiếp cho client qua API response, sau đó client lại chuyển `resetToken` này sang trang đặt lại mật khẩu để xác thực làm giảm tính bảo mật của mã xác thực OTP 6 số. OTP lúc này chỉ đóng vai trò hiển thị chứ không được Backend đối chiếu thực tế khi đặt lại mật khẩu.
* **`resetPassword(resetToken, newPassword)`**:
  - Tìm kiếm người dùng bằng `UserRepository.findByResetToken(resetToken)`.
  - Không hề đối chiếu mã OTP từ client gửi lên (thậm chí client không cần gửi OTP).
  - Đặt lại mật khẩu và xóa token.

### 1.2. Backend Controller & Routes (`backend/src/controllers/auth.controller.js`)
* Handler `resetPassword` nhận `{ resetToken, newPassword }` từ `req.body` và truyền sang service.
* Route `/reset-password` không thực hiện validation trung gian trên body.

### 1.3. User Repository (`backend/src/repositories/user.repository.js`)
* Sử dụng phương thức `findByResetToken(token, callback)` để tìm kiếm người dùng có `resetPasswordToken` trùng khớp và còn hạn.

### 1.4. Frontend Pages (`frontend/src/pages/auth/...`)
* **`ForgotPasswordPage.jsx`**: Gửi email -> nhận về `otp` và `resetToken` -> điều hướng sang `/reset-password` bằng React Router `navigate` kèm `state: { resetToken, otp }`.
* **`ResetPasswordPage.jsx`**: Nhận `resetToken` và `otp` từ `location.state`. Nếu không có `resetToken`, nó sẽ tự động redirect về trang quên mật khẩu. Trang này chỉ hiển thị OTP dạng chế độ TEST và có các ô nhập mật khẩu mới, không có ô nhập mã OTP từ người dùng. Khi submit, nó gửi `{ resetToken, newPassword }` lên Backend.

---

## 2. Chiến lược triển khai Code chi tiết

### 2.1. Backend Services (`backend/src/services/auth.service.js`)

**Thay đổi 1: Hàm `forgotPassword`**
* **Mục tiêu**: Lưu trực tiếp mã OTP 6 số vào trường `resetPasswordToken` trong database và không sinh/trả về `resetToken` nữa.
* **Code chi tiết**:
```javascript
// Gửi OTP quên mật khẩu — tạo token 6 số, hết hạn sau 15 phút
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

  // Lưu OTP trực tiếp vào resetPasswordToken và đặt thời hạn 15 phút
  user.resetPasswordToken = otp;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phút
  await user.save();

  // Log ra console để test
  console.log(`\n🔑 [FORGOT PASSWORD] Email: ${email} | OTP: ${otp}\n`);

  // Trả về OTP cho client (chỉ dùng khi chưa có email server để test)
  return {
    message: 'Mã OTP đã được gửi đến email của bạn',
    otp, // ⚠️ Chỉ trả về để test — xóa khi production
  };
};
```

**Thay đổi 2: Hàm `resetPassword`**
* **Mục tiêu**: Nhận `(email, otp, newPassword)`. Tìm user bằng email, so khớp OTP với `resetPasswordToken`, kiểm tra thời hạn và tiến hành đổi mật khẩu.
* **Code chi tiết**:
```javascript
// Đặt lại mật khẩu bằng OTP
const resetPassword = async (email, otp, newPassword) => {
  if (!email || !otp || !newPassword) {
    throw new AppError('Email, mã OTP và mật khẩu mới không được để trống', 400);
  }
  if (newPassword.length < 6) {
    throw new AppError('Mật khẩu mới phải từ 6 ký tự trở lên', 400);
  }

  // Tìm user theo email
  const user = await new Promise((resolve, reject) => {
    UserRepository.findByEmail(email, (err, doc) => {
      if (err) return reject(err);
      resolve(doc);
    });
  });

  if (!user) {
    throw new AppError('Không tìm thấy người dùng với email này', 404);
  }

  // So sánh OTP trực tiếp
  if (!user.resetPasswordToken || user.resetPasswordToken !== otp) {
    throw new AppError('Mã OTP không hợp lệ', 400);
  }

  // Kiểm tra thời gian hết hạn của OTP
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

---

### 2.2. Backend Controller (`backend/src/controllers/auth.controller.js`)
* **Mục tiêu**: Cập nhật hàm handler `resetPassword` để giải nén `{ email, otp, newPassword }` từ `req.body`.
* **Code chi tiết**:
```javascript
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await AuthService.resetPassword(email, otp, newPassword);
    res.status(200).json(sendSuccess('Đặt lại mật khẩu thành công', result));
  } catch (error) { next(error); }
};
```

---

### 2.3. User Repository (`backend/src/repositories/user.repository.js`)
* **Đề xuất dọn dẹp**: Xóa bỏ hoặc đánh dấu deprecate phương thức `findByResetToken` vì không dùng đến nữa. Toàn bộ thao tác truy vấn sẽ dựa vào `findByEmail`.
```javascript
  // ĐÃ KHÔNG CÒN SỬ DỤNG - Để lại để tránh ảnh hưởng compile hoặc xóa hẳn
  // findByResetToken: (token, callback) => { ... }
```

---

### 2.4. Frontend - ForgotPasswordPage (`frontend/src/pages/auth/ForgotPasswordPage.jsx`)
* **Mục tiêu**: Điều hướng sang `/reset-password` và truyền `email` (và `otp` để test) thay vì truyền `resetToken`.
* **Code chi tiết tại onSubmit**:
```javascript
  const onSubmit = async (data) => {
    try {
      const res = await authService.forgotPassword(data.email);
      const result = res.data?.data;
      setSentData(result);
      toast.success('Đã gửi mã OTP! Kiểm tra hộp thư của bạn.');
      // Chuyển sang trang đặt lại mật khẩu, truyền email và otp qua state
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

---

### 2.5. Frontend - ResetPasswordPage (`frontend/src/pages/auth/ResetPasswordPage.jsx`)
* **Mục tiêu**:
  - Nhận `email` từ state điều hướng.
  - Kiểm tra tính hợp lệ dựa trên `email` (thay vì `resetToken`).
  - Thêm ô nhập mã OTP 6 số bắt buộc.
  - Submit cả `{ email, otp, newPassword }`.
* **Code chi tiết**:

**Cập nhật phần lấy state và check useEffect**:
```javascript
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

**Cập nhật hàm onSubmit**:
```javascript
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

**Cập nhật phần Render Form (Thêm input OTP trước Mật khẩu mới)**:
```jsx
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none font-mono tracking-widest text-center"
                  placeholder="------"
                  {...register('otp', {
                    required: 'Vui lòng nhập mã OTP',
                    pattern: { value: /^[0-9]{6}$/, message: 'Mã OTP phải gồm 6 chữ số' }
                  })}
                />
              </div>
              {errors.otp && (
                <p className="text-rose-500 text-xs mt-1 font-medium">{errors.otp.message}</p>
              )}
            </div>

            {/* Mật khẩu mới */}
            <div className="space-y-2">
              ...
            </div>
```

---

## 3. Phân tích Các trường hợp đặc biệt & Rủi ro (Edge Cases & Issues)

| STT | Trường hợp / Rủi ro | Phân tích chi tiết & Giải pháp khắc phục |
|---|---|---|
| **1** | **Tấn công brute-force mã OTP** | **Nguy cơ**: Vì OTP chỉ gồm 6 chữ số (1,000,000 khả năng), kẻ tấn công có thể liên tục gọi API `/reset-password` để đoán mã OTP của một email cụ thể trong vòng 15 phút hiệu lực.<br>**Giải pháp**: Cần triển khai Rate Limiting trên API `/reset-password` (ví dụ: tối đa 5 requests sai/IP/15 phút) hoặc thêm trường đếm số lần nhập sai `otpAttempts` vào Schema User, khóa mã OTP đó nếu nhập sai quá 5 lần. |
| **2** | **Mất state khi Reload trang** | **Nguy cơ**: Trong React, nếu người dùng tải lại trang (F5) khi đang ở `/reset-password`, `location.state` sẽ bị xóa sạch, dẫn đến việc mất trường `email` và kích hoạt redirect về `/forgot-password`.<br>**Đánh giá**: Đây là hành vi bình thường và an toàn. Tuy nhiên, nếu muốn cải thiện trải nghiệm người dùng, ta có thể lưu tạm email đã mã hóa vào `sessionStorage` khi gửi OTP thành công và khôi phục khi reload. |
| **3** | **Đồng bộ hóa thời gian (Time Drift)** | **Nguy cơ**: Việc so sánh `user.resetPasswordExpires < Date.now()` phụ thuộc vào thời gian của máy chủ database/ứng dụng. Nếu thời gian hệ thống bị lệch, OTP có thể hết hạn trước 15 phút hoặc kéo dài hơn.<br>**Giải pháp**: Đảm bảo máy chủ đồng bộ thời gian NTP chính xác. |
| **4** | **Bảo mật phản hồi API (Email Enumeration)** | **Nguy cơ**: API `/forgot-password` nếu phản hồi khác nhau rõ rệt khi email tồn tại và không tồn tại sẽ giúp kẻ tấn công dò tìm các email đăng ký trong hệ thống.<br>**Giải pháp**: Code hiện tại phản hồi `"Nếu email tồn tại, mã OTP đã được gửi"` là rất chính xác và bảo mật. Nên tiếp tục duy trì nguyên tắc này. |
| **5** | **Tương thích Schema Database** | **Đánh giá**: Rất tốt. Trường `resetPasswordToken` trong `User.model.js` có kiểu dữ liệu `String` nên lưu được cả chuỗi token hex lẫn OTP 6 số dạng string. Trường `resetPasswordExpires` có kiểu `Date` nên hoạt động hoàn hảo với `Date.now()`. Không yêu cầu chỉnh sửa Schema hay migrate database. |
