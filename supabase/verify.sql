-- Verifikasi setelah menjalankan ketiga migration.
-- Tempel SELURUH isi file ini di SQL Editor, lalu Run sekali.
--
-- Semua hasil dikumpulkan ke satu tabel sementara dan ditampilkan oleh SELECT
-- terakhir, karena SQL Editor hanya menampilkan hasil statement terakhir.
-- Semua baris harus "ok". Baris "akun operator" boleh "BELUM" selama akun
-- operator memang belum dibuat.

drop table if exists verify_results;
create temp table verify_results (
  urutan integer,
  pemeriksaan text,
  hasil text
);

-- 1. Semua tabel harus ada.
insert into verify_results
select 1, 'tabel lengkap',
  case when count(*) = 14 then 'ok'
       else 'GAGAL: hanya ' || count(*) || ' dari 14 tabel' end
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'media_assets', 'site_settings', 'principal_profile', 'service_contacts',
    'village_officials', 'bpd_members', 'statistics', 'facilities',
    'financial_data', 'news', 'news_images', 'gallery_albums', 'gallery_images',
    'admin_users'
  );

-- 2. RLS harus aktif di 14 tabel, termasuk admin_users.
insert into verify_results
select 2, 'rls aktif',
  case when count(*) = 14 then 'ok'
       else 'GAGAL: ' || count(*) || ' dari 14 tabel' end
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relrowsecurity = true and c.relkind = 'r';

-- 3. 13 tabel konten x 4 policy = 52 policy.
insert into verify_results
select 3, 'policy konten',
  case when count(*) = 52 then 'ok'
       else 'GAGAL: ' || count(*) || ' policy, seharusnya 52' end
from pg_policies
where schemaname = 'public' and tablename <> 'admin_users';

-- 4. admin_users tidak boleh punya policy sama sekali.
insert into verify_results
select 4, 'admin_users tertutup',
  case when count(*) = 0 then 'ok'
       else 'GAGAL: ada ' || count(*) || ' policy' end
from pg_policies
where schemaname = 'public' and tablename = 'admin_users';

-- 5. Bucket media harus ada dengan batas 5 MB.
insert into verify_results
select 5, 'bucket media',
  case when count(*) = 1 then 'ok'
       else 'GAGAL: bucket media tidak ada atau batasnya salah' end
from storage.buckets
where id = 'media' and file_size_limit = 5242880 and public = true;

-- 6. Policy Storage harus ada 4.
insert into verify_results
select 6, 'policy storage',
  case when count(*) = 4 then 'ok'
       else 'GAGAL: ' || count(*) || ' policy storage' end
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'media_%';

-- 6b. Izin tabel untuk anon: 13 tabel konten harus bisa dibaca.
-- RLS tidak menggantikan GRANT. Tanpa ini, request anon gagal dengan
-- "permission denied" sebelum policy dievaluasi.
insert into verify_results
select 7, 'izin baca anon',
  case when count(*) = 13 then 'ok'
       else 'GAGAL: ' || count(*) || ' dari 13 tabel tanpa select untuk anon' end
from information_schema.role_table_grants
where grantee = 'anon' and table_schema = 'public'
  and privilege_type = 'SELECT'
  and table_name in (
    'media_assets', 'site_settings', 'principal_profile', 'service_contacts',
    'village_officials', 'bpd_members', 'statistics', 'facilities',
    'financial_data', 'news', 'news_images', 'gallery_albums', 'gallery_images'
  );

-- 6c. anon tidak boleh punya izin tulis sama sekali.
insert into verify_results
select 8, 'anon tidak bisa menulis',
  case when count(*) = 0 then 'ok'
       else 'GAGAL: anon punya izin ' || string_agg(privilege_type, ', ') end
from information_schema.role_table_grants
where grantee = 'anon' and table_schema = 'public'
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE');

-- 6d. admin_users tidak boleh bisa dibaca klien.
insert into verify_results
select 9, 'admin_users tidak terbaca klien',
  case when count(*) = 0 then 'ok'
       else 'GAGAL: ' || string_agg(grantee || ':' || privilege_type, ', ') end
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'admin_users'
  and grantee in ('anon', 'authenticated');

-- 7. Data seed terisi dengan jumlah yang benar.
insert into verify_results
select 10, 'seed statistik',
  case when count(*) = 29 then 'ok'
       else 'GAGAL: ' || count(*) || ' baris, seharusnya 29' end
from public.statistics;

insert into verify_results
select 11, 'seed keuangan',
  case when count(*) = 11 then 'ok'
       else 'GAGAL: ' || count(*) || ' baris, seharusnya 11' end
from public.financial_data;

insert into verify_results
select 12, 'seed perangkat',
  case when count(*) = 8 then 'ok'
       else 'GAGAL: ' || count(*) || ' baris, seharusnya 8' end
from public.village_officials;

insert into verify_results
select 13, 'seed berita',
  case when count(*) = 3 then 'ok'
       else 'GAGAL: ' || count(*) || ' baris, seharusnya 3' end
from public.news;

insert into verify_results
select 14, 'seed album',
  case when count(*) = 2 then 'ok'
       else 'GAGAL: ' || count(*) || ' baris, seharusnya 2' end
from public.gallery_albums;

-- 12. Nilai tidak tersedia harus tetap null, bukan 0.
insert into verify_results
select 15, 'null bukan nol',
  case when count(*) = 3 then 'ok'
       else 'GAGAL: ' || count(*) || ' baris pendapatan bernilai null' end
from public.financial_data
where category = 'Pendapatan' and value is null;

-- 13. Foto unggulan tiap album harus benar-benar milik album itu.
insert into verify_results
select 16, 'unggulan album valid',
  case when count(*) = 0 then 'ok'
       else 'GAGAL: ' || count(*) || ' album dengan unggulan di luar albumnya' end
from public.gallery_albums a
where a.cover_media_id is not null
  and not exists (
    select 1 from public.gallery_images g
    where g.album_id = a.id and g.media_id = a.cover_media_id
  );

-- 14. Constraint tahun 2026 harus menolak tahun lain.
-- Kalau ternyata diterima, baris uji dihapus lagi supaya data tidak rusak.
do $$
declare
  ditolak boolean := false;
begin
  begin
    insert into public.statistics (year, category, label, value, unit)
    values (2025, 'Kependudukan', 'uji tahun', 1, 'jiwa');
  exception
    when check_violation then ditolak := true;
  end;

  if not ditolak then
    delete from public.statistics where label = 'uji tahun';
  end if;

  insert into verify_results
  select 17, 'tahun terkunci 2026',
    case when ditolak then 'ok'
         else 'GAGAL: constraint tahun tidak bekerja' end;
end;
$$;

-- 15. Trigger unggulan harus menolak foto dari album lain.
-- Nilai asli dikembalikan apa pun hasilnya, supaya pengujian tidak mengubah data.
do $$
declare
  album_id uuid;
  asing uuid;
  asli uuid;
  ditolak boolean := false;
begin
  select id, cover_media_id into album_id, asli
  from public.gallery_albums where slug = 'pertanian-dan-keseharian';

  select id into asing from public.media_assets where storage_path = 'images/landscape.jpg';

  begin
    update public.gallery_albums set cover_media_id = asing where id = album_id;
    -- Kalau sampai di sini, trigger tidak menolak. Kembalikan nilai asli.
    update public.gallery_albums set cover_media_id = asli where id = album_id;
  exception
    when check_violation then ditolak := true;
  end;

  insert into verify_results
  select 18, 'unggulan album dijaga trigger',
    case when ditolak then 'ok'
         else 'GAGAL: trigger tidak bekerja' end;
end;
$$;

-- 16. Akun operator. Boleh BELUM selama akun belum dibuat.
insert into verify_results
select 19, 'akun operator',
  case when count(*) >= 1 then 'ok: ' || count(*) || ' operator terdaftar'
       else 'BELUM: daftarkan akun di admin_users' end
from public.admin_users;

-- Hasil akhir: satu tabel berisi semua pemeriksaan.
select urutan, pemeriksaan, hasil
from verify_results
order by urutan;
