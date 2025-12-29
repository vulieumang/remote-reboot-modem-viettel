# Viettel Modem Reboot Tool

Công cụ giúp khởi động lại (Reboot) modem Viettel (như F670Y, F671Y...) chỉ với 1 cú click. Tránh nhầm lẫn với việc Reset Factory (Xóa cài đặt).

Dự án này cung cấp **3 phiên bản** để bạn lựa chọn tùy theo nhu cầu:

## 1. Phiên bản Chrome Extension (Khuyên dùng)
Đây là cách **tốt nhất** để chạy trong trình duyệt mà không bị chặn bảo mật (CORS).

**Cài đặt:**
1.  Mở Chrome, gõ `chrome://extensions` vào thanh địa chỉ.
2.  Bật **Developer mode** ở góc phải.
3.  Bấm nút **Load unpacked** (góc trái).
4.  Chọn thư mục `extension`.
5.  Click vào icon mới hiện trên thanh công cụ và bấm nút "Reboot Modem".

---

## 2. Phiên bản Node.js (Chạy Local)
Dùng cho máy tính cá nhân đã cài Node.js. Chạy như một phần mềm độc lập.

**Sử dụng trên Windows:**
1. Mở thư mục `nodejs`.
2. Chạy file `run.bat`.

**Sử dụng trên Mac:**
1. Mở thư mục `nodejs`.
2. Click chuột phải vào file `run.command` -> Chọn **Open**.
3. Hoặc mở terminal trong thư mục `nodejs` gõ `npm start`.

4. Trình duyệt sẽ tự mở trang web điều khiển (http://localhost:3000).

---

## 3. Phiên bản PHP (Chạy XAMPP)
Dành cho bạn muốn chạy trên Web Server Local (như XAMPP).

**Sử dụng:**
1.  Copy nội dung thư mục `php` vào `htdocs/reboot`.
2.  Khởi động Apache.
3.  Truy cập `http://localhost/reboot/index.html`.

---

**Lưu ý:**
*   **Tác giả:** Tiến Vũ witi.vn vu@witi.vn
*   **Username/Password mặc định:** Xem nhãn dán ở mặt sau modem (thường là admin).
*   **Trình duyệt:** Hãy dùng Chrome hoặc các trình duyệt nhân Chromium.