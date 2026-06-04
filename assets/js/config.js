/* ============================================================
   CẤU HÌNH KẾT NỐI SUPABASE
   ------------------------------------------------------------
   1) Tạo dự án tại https://supabase.com  (Project)
   2) Vào Project Settings → API, sao chép:
        - Project URL        →  dán vào SUPABASE_URL
        - anon public key     →  dán vào SUPABASE_ANON_KEY
   3) "anon key" là khóa CÔNG KHAI, an toàn để đặt ở đây.
      (Bảo mật được bảo đảm bằng RLS trong cơ sở dữ liệu.)
   Khi CHƯA cấu hình, website vẫn chạy ở chế độ xem (dữ liệu mẫu).
   ============================================================ */
window.APP_CONFIG = {
  SUPABASE_URL: "YOUR_SUPABASE_URL",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY"
};
