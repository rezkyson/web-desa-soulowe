-- Verifikasi setelah menjalankan ketiga migration.
-- Tempel seluruh isi file ini di SQL Editor, lalu Run.
-- Semua baris hasil harus bernilai "ok". Kalau ada yang bukan "ok", jangan
-- lanjut ke tahap API: kirim hasilnya untuk diperbaiki.

-- 1. Semua tabel harus ada.
select 'tabel' as pemeriksaan,
  case when count(*) = 14 then 'ok' else 'GAGAL: hanya ' || count(*) || ' dari 14 tabel' end as hasil
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'media_assets', 'site_settings', 'principal_profile', 'service_contacts',
    'village_officials', 'bpd_members', 'statistics', 'facilities',
    'financial_data', 'news', 'news_images', 'gallery_albums', 'gallery_images',
    'admin_users'
  );

-- 2. RLS harus aktif di 14 tabel, termasuk admin_users.
select 'rls aktif' as pemeriksaan,
  case when count(*) = 14 then 'ok' else 'GAGAL: ' || count(*) || ' dari 14' end as hasil
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relrowsecurity = true
  and c.relkind = 'r';

-- 3. Jumlah policy harus 52 untuk 13 tabel konten (4 policy tiap tabel).
select 'policy konten' as pemeriksaan,
  case when count(*) = 52 then 'ok' else 'GAGAL: ' || count(*) || ' policy' end as hasil
from pg_policies
where schemaname = 'public'
  and tablename <> 'admin_users';

-- 4. admin_users tidak boleh punya policy sama sekali.
select 'admin_users tertutup' as pemeriksaan,
  case when count(*) = 0 then 'ok' else 'GAGAL: ada ' || count(*) || ' policy' end as hasil
from pg_policies
where schemaname = 'public' and tablename = 'admin_users';

-- 5. Bucket media harus ada dengan batas 5 MB.
select 'bucket media' as pemeriksaan,
  case when count(*) = 1 then 'ok' else 'GAGAL: bucket tidak ada' end as hasil
from storage.buckets
where id = 'media' and file_size_limit = 5242880 and public = true;

-- 6. Data seed harus terisi.
select 'seed statistik' as pemeriksaan,
  case when count(*) = 29 then 'ok' else 'GAGAL: ' || count(*) || ' baris' end as hasil
from public.statistics;

select 'seed keuangan' as pemeriksaan,
  case when count(*) = 11 then 'ok' else 'GAGAL: ' || count(*) || ' baris' end as hasil
from public.financial_data;

select 'seed perangkat' as pemeriksaan,
  case when count(*) = 8 then 'ok' else 'GAGAL: ' || count(*) || ' baris' end as hasil
from public.village_officials;
select 'seed berita' as pemeriksaan,
  case when count(*) = 3 then 'ok' else 'GAGAL: ' || count(*) || ' baris' end as hasil
from public.news;

-- 7. Nilai null harus tetap null, bukan berubah jadi 0.
select 'null bukan nol' as pemeriksaan,
  case when count(*) = 3 then 'ok' else 'GAGAL: ' || count(*) || ' baris bernilai null' end as hasil
from public.financial_data
where category = 'Pendapatan' and value is null;

-- 8. Tahun harus terkunci 2026. Ini harus GAGAL saat dijalankan.
do $$
begin
  insert into public.statistics (year, category, label, value, unit)
  values (2025, 'Kependudukan', 'uji tahun', 1, 'jiwa');
  raise exception 'GAGAL: constraint tahun tidak bekerja, baris 2025 diterima';
exception
  when check_violation then null;
end;
$$;

select 'tahun terkunci 2026' as pemeriksaan, 'ok' as hasil;

-- 9. Foto unggulan album harus milik album itu. Ini harus GAGAL.
do $$
declare
  album_id uuid;
  asing uuid;
begin
  select id into album_id from public.gallery_albums where slug = 'pertanian-dan-keseharian';
  select id into asing from public.media_assets where storage_path = 'images/landscape.jpg';

  begin
    update public.gallery_albums set cover_media_id = asing where id = album_id;
    raise exception 'GAGAL: trigger unggulan tidak bekerja, foto album lain diterima';
  exception
    when check_violation then null;
  end;
end;
$$;

select 'unggulan album dijaga' as pemeriksaan, 'ok' as hasil;

-- 10. Akun operator. Ini bukan kegagalan, hanya status.
select 'akun operator' as pemeriksaan,
  case when count(*) >= 1 then 'ok: ' || count(*) || ' operator terdaftar'
       else 'BELUM: daftarkan akun di admin_users' end as hasil
from public.admin_users;
