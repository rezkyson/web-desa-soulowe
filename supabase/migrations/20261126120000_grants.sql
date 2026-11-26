-- Perbaikan Fase 2, BE-11: izin tabel untuk role anon dan authenticated.
--
-- Kenapa file ini ada:
-- Migration sebelumnya mengaktifkan RLS dan membuat policy, tetapi tidak pernah
-- memberikan GRANT pada tabel. Di PostgreSQL, RLS hanya menyaring baris setelah
-- role punya izin tabel. Tanpa GRANT, request anon gagal lebih dulu dengan
-- "permission denied for table ..." dan policy tidak pernah dievaluasi.
--
-- Supabase tidak memberi grant otomatis untuk tabel yang dibuat lewat SQL
-- Editor, jadi ini harus eksplisit.
--
-- Pembagian izin:
--   anon          : hanya SELECT. Membaca konten publik, tidak bisa menulis.
--   authenticated : SELECT/INSERT/UPDATE/DELETE. RLS tetap membatasi tulisan
--                   hanya untuk operator terdaftar (public.is_operator()).
--   admin_users   : tidak diberi izin apa pun ke klien. Hanya service role.
--
-- Aman dijalankan ulang: GRANT bersifat idempoten.

do $$
declare
  t text;
  content_tables text[] := array[
    'media_assets', 'site_settings', 'principal_profile', 'service_contacts',
    'village_officials', 'bpd_members', 'statistics', 'facilities',
    'financial_data', 'news', 'news_images', 'gallery_albums', 'gallery_images'
  ];
begin
  foreach t in array content_tables loop
    -- Baca publik.
    execute format('grant select on public.%I to anon', t);

    -- Operator yang sudah login. Policy RLS tetap yang menentukan baris mana
    -- yang boleh ditulis.
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;

  -- Tabel daftar operator: cabut semua akses klien, apa pun yang mungkin
  -- terlanjur diberikan sebelumnya.
  execute 'revoke all on public.admin_users from anon, authenticated';
end;
$$;

-- Fungsi helper perlu bisa dipanggil oleh klien agar policy bisa dievaluasi.
grant execute on function public.is_operator() to anon, authenticated;
