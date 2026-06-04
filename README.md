# Website Chi bộ Ban Pháp chế HĐND tỉnh Thanh Hóa

Website giới thiệu, quản lý nhân sự, tin tức và văn bản của Chi bộ — có **đăng nhập quản trị thật** và **cơ sở dữ liệu dùng chung** (Supabase), triển khai công khai trên **GitHub Pages**.

- Giao diện: HTML/CSS/JavaScript thuần (không cần build).
- Backend: **Supabase** (PostgreSQL + Auth + Storage).
- Hosting: **GitHub Pages** (miễn phí, HTTPS).

---

## 🏛️ Kiến trúc

```
Trình duyệt  ──►  GitHub Pages (web tĩnh)  ──►  Supabase (DB + Đăng nhập + Ảnh)
```

Khi **chưa cấu hình Supabase**, website vẫn chạy ở chế độ xem với dữ liệu mẫu.

---

## 🚀 HƯỚNG DẪN TRIỂN KHAI (làm 1 lần)

### Bước 1 — Tạo dự án Supabase
1. Vào https://supabase.com → đăng nhập → **New project**.
2. Đặt tên (vd: `chibo-phapche`), chọn **Region: Southeast Asia (Singapore)**, đặt mật khẩu database.
3. Chờ ~2 phút cho dự án khởi tạo.

### Bước 2 — Tạo bảng & phân quyền
1. Mở **SQL Editor** (thanh trái) → **New query**.
2. Mở tệp [`supabase/setup.sql`](supabase/setup.sql), sao chép **toàn bộ**, dán vào, bấm **Run**.
3. Báo "Success" là xong (đã tạo bảng, RLS, kho ảnh và dữ liệu mẫu).

### Bước 3 — Tạo tài khoản quản trị
1. Vào **Authentication → Users → Add user**.
2. Nhập **Email** và **Password** cho người quản trị, bật **Auto Confirm User**.
3. (Khuyến nghị) Vào **Authentication → Providers → Email**: **tắt** "Allow new users to sign up" để không ai tự đăng ký được.

### Bước 4 — Lấy khóa kết nối
1. Vào **Project Settings → API**.
2. Sao chép **Project URL** và **anon public key**.
3. Mở tệp [`assets/js/config.js`](assets/js/config.js), dán vào:
   ```js
   window.APP_CONFIG = {
     SUPABASE_URL: "https://xxxxx.supabase.co",
     SUPABASE_ANON_KEY: "eyJhbGciOi..."
   };
   ```
   > `anon key` là khóa công khai, an toàn để đặt ở đây — dữ liệu được bảo vệ bằng RLS.

### Bước 5 — Đưa mã lên GitHub & public
1. Tạo repo mới trên https://github.com (vd: `chibo-phapche`), để **Public**.
2. Tại thư mục dự án, chạy (đổi `<URL>` theo repo của bạn):
   ```bash
   git init
   git add .
   git commit -m "Website Chi bộ Ban Pháp chế"
   git branch -M main
   git remote add origin <URL-repo-github>.git
   git push -u origin main
   ```
3. Trên GitHub: **Settings → Pages → Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main** / thư mục **/(root)** → **Save**.
4. Chờ 1–2 phút, GitHub cấp địa chỉ dạng:
   `https://<tên-github>.github.io/chibo-phapche/`

### Bước 6 — Cho phép tên miền GitHub Pages gọi Supabase (CORS)
Mặc định Supabase cho phép mọi nguồn gọi API công khai nên thường **không cần** chỉnh. Nếu gặp lỗi, kiểm tra lại URL/khóa trong `config.js`.

✅ Xong! Mở địa chỉ GitHub Pages, bấm **🔒 Quản trị**, đăng nhập bằng tài khoản đã tạo ở Bước 3.

---

## 🔁 Cập nhật nội dung sau này
- **Nội dung** (đảng viên, tin bài, văn bản, ảnh): đăng nhập quản trị ngay trên web — lưu thẳng vào Supabase, mọi người đều thấy.
- **Giao diện/mã nguồn**: sửa file rồi `git push` — GitHub Pages tự cập nhật.

---

## 🔐 Ghi chú bảo mật
- Mật khẩu quản trị được Supabase mã hóa, **không** nằm trong mã nguồn.
- RLS đảm bảo: ai cũng **xem** được, chỉ người **đăng nhập** mới **sửa**.
- Không đưa `service_role key` vào website (chỉ dùng `anon key`).

---

## 📂 Cấu trúc thư mục
```
index.html, gioi-thieu.html, tin-tuc.html, van-ban.html
styles.css
assets/js/config.js   ← dán khóa Supabase tại đây
assets/js/api.js      ← lớp kết nối Supabase
assets/js/app.js      ← giao diện, đăng nhập, chỉnh sửa
supabase/setup.sql    ← chạy 1 lần để tạo CSDL
```

---

## 💻 Chạy thử trên máy (tùy chọn)
```bash
python -m http.server 5599
# rồi mở http://localhost:5599
```
> Lưu ý: nên thêm cả `http://localhost:5599` vào danh sách cho phép nếu cần.
