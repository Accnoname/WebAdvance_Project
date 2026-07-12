@echo off
echo ==============================================
echo Khởi động Server (Backend) và Web (Frontend)...
echo ==============================================

:: Cài đặt thư viện nếu chưa có ở thư mục gốc
if not exist "node_modules" (
    echo Đang cài đặt thư viện chung ^(concurrently^)...
    npm install
)

:: Chạy script dev chung (đã được định nghĩa trong package.json)
npm run dev

pause
