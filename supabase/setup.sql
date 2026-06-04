-- ============================================================
--  THIẾT LẬP CƠ SỞ DỮ LIỆU SUPABASE
--  Website Chi bộ Ban Pháp chế HĐND tỉnh Thanh Hóa
--  Cách dùng: Mở Supabase → SQL Editor → dán toàn bộ → Run.
--  (Chạy lại nhiều lần được, không gây lỗi.)
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- BẢNG ----------
create table if not exists public.members (
  id          text primary key,
  name        text not null,
  position    text not null,
  badge       text not null,
  description text,
  is_lead     boolean default false,
  photo_url   text,
  sort        int default 0,
  updated_at  timestamptz default now()
);

create table if not exists public.news (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  date_label text,
  category   text,
  color      text default '#b01217',
  summary    text,
  body       text,
  image_url  text,
  created_at timestamptz default now()
);

create table if not exists public.documents (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  meta       text,
  tag        text,
  url        text,
  created_at timestamptz default now()
);

-- ---------- BẬT ROW LEVEL SECURITY ----------
alter table public.members   enable row level security;
alter table public.news      enable row level security;
alter table public.documents enable row level security;

-- Ai cũng ĐỌC được (website công khai)
drop policy if exists "read members"   on public.members;
drop policy if exists "read news"       on public.news;
drop policy if exists "read documents"  on public.documents;
create policy "read members"  on public.members  for select using (true);
create policy "read news"      on public.news      for select using (true);
create policy "read documents" on public.documents for select using (true);

-- Chỉ người ĐÃ ĐĂNG NHẬP (quản trị) mới được GHI
drop policy if exists "write members"   on public.members;
drop policy if exists "write news"       on public.news;
drop policy if exists "write documents"  on public.documents;
create policy "write members"  on public.members  for all to authenticated using (true) with check (true);
create policy "write news"      on public.news      for all to authenticated using (true) with check (true);
create policy "write documents" on public.documents for all to authenticated using (true) with check (true);

-- ---------- STORAGE (lưu ảnh) ----------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "read media"   on storage.objects;
drop policy if exists "upload media" on storage.objects;
drop policy if exists "update media" on storage.objects;
drop policy if exists "delete media" on storage.objects;
create policy "read media"   on storage.objects for select using (bucket_id = 'media');
create policy "upload media" on storage.objects for insert to authenticated with check (bucket_id = 'media');
create policy "update media" on storage.objects for update to authenticated using (bucket_id = 'media');
create policy "delete media" on storage.objects for delete to authenticated using (bucket_id = 'media');

-- ---------- DỮ LIỆU BAN ĐẦU ----------
insert into public.members (id,name,position,badge,description,is_lead,sort) values
('m1','Đồng chí Bí thư Chi bộ','Trưởng Ban Pháp chế HĐND tỉnh','Bí thư','Phụ trách chung, lãnh đạo toàn diện công tác Đảng và chuyên môn của Chi bộ.',true,1),
('m2','Đồng chí Phó Bí thư Chi bộ','Phó Trưởng Ban Pháp chế HĐND tỉnh','Phó Bí thư','Giúp Bí thư điều hành, phụ trách công tác xây dựng Đảng và kiểm tra, giám sát.',true,2),
('m3','Đồng chí Đảng viên','Phó Chánh Văn phòng Đoàn ĐBQH và HĐND tỉnh','Đảng viên','Tham mưu công tác tổng hợp, phối hợp phục vụ hoạt động của Ban.',false,3),
('m4','Đồng chí Đảng viên','Chuyên viên Phòng Công tác Hội đồng','Đảng viên','Tham mưu phục vụ hoạt động thẩm tra, giám sát của HĐND tỉnh.',false,4),
('m5','Đồng chí Đảng viên','Chuyên viên Phòng Tổng hợp, Thông tin Dân nguyện','Đảng viên','Tham mưu công tác tổng hợp và xử lý đơn thư, dân nguyện.',false,5),
('m6','Đồng chí Đảng viên','Ủy viên chuyên trách Ban Pháp chế','Đảng viên','Trực tiếp thực hiện nhiệm vụ chuyên môn của Ban Pháp chế.',false,6)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from public.news) then
    insert into public.news (title,date_label,category,color,summary,body) values
    ('Sinh hoạt Chi bộ định kỳ chuyên đề quý II','Tháng 6/2026','SINH HOẠT','#b01217',
     'Chi bộ tổ chức sinh hoạt chuyên đề về nâng cao chất lượng công tác giám sát của HĐND tỉnh.',
     'Trong buổi sinh hoạt chuyên đề quý II/2026, Chi bộ Ban Pháp chế đã tập trung thảo luận các giải pháp nâng cao chất lượng, hiệu quả công tác thẩm tra, giám sát của HĐND tỉnh; phát huy vai trò tiền phong, gương mẫu của đảng viên.'),
    ('Học tập, quán triệt nghị quyết của Đảng','Tháng 5/2026','HỌC TẬP','#c9962b',
     'Đảng viên Chi bộ tham gia học tập, quán triệt các nghị quyết, chỉ thị mới của Trung ương và Tỉnh ủy.',
     'Toàn thể đảng viên Chi bộ nghiêm túc tham gia hội nghị học tập, quán triệt các nghị quyết, chỉ thị mới; liên hệ vận dụng vào thực tiễn công tác chuyên môn.'),
    ('Tham mưu giám sát chuyên đề lĩnh vực tư pháp','Tháng 4/2026','GIÁM SÁT','#155e3b',
     'Ban Pháp chế hoàn thành tham mưu chương trình giám sát chuyên đề trình Thường trực HĐND tỉnh.',
     'Ban Pháp chế đã hoàn thành tham mưu xây dựng kế hoạch và đề cương giám sát chuyên đề lĩnh vực tư pháp, bảo đảm tiến độ và chất lượng.');
  end if;

  if not exists (select 1 from public.documents) then
    insert into public.documents (title,meta,tag) values
    ('Quy chế làm việc của Chi bộ Ban Pháp chế','Tài liệu nội bộ','Quy chế'),
    ('Nghị quyết sinh hoạt Chi bộ định kỳ','Cập nhật hằng tháng','Nghị quyết'),
    ('Báo cáo tổng kết công tác Đảng năm','Báo cáo thường niên','Báo cáo'),
    ('Kế hoạch học tập và làm theo Bác','Theo chuyên đề năm','Kế hoạch');
  end if;
end $$;

-- HOÀN TẤT. Tiếp theo: tạo tài khoản quản trị trong
-- Authentication → Users → Add user (đặt email + mật khẩu, bật Auto Confirm).
