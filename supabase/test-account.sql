-- Akun uji sementara untuk melacak bug sesi.
-- Dibuat langsung di Supabase Auth, didaftarkan sebagai operator, lalu
-- dihapus lagi setelah diagnosis selesai.
--
-- Jalankan seluruh blok ini sekali di SQL Editor.

-- crypt() dan gen_salt() disediakan pgcrypto. Di Supabase ekstensi ini biasanya
-- sudah ada di schema extensions, jadi dirujuk dengan nama schema lengkap.
create extension if not exists pgcrypto with schema extensions;

do $$
declare
  uid uuid;
  test_email text := 'uji-sesi@desasoulowe.test';
  test_password text := 'UjiSesiSementara2026!';
begin
  -- Hapus sisa percobaan sebelumnya, kalau ada.
  delete from public.admin_users where email = test_email;
  delete from auth.users where email = test_email;

  -- Buat user dengan email sudah terkonfirmasi, supaya bisa langsung login.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    test_email,
    extensions.crypt(test_password, extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  )
  returning id into uid;

  -- Identitas email, dibutuhkan Supabase Auth versi baru agar login dikenali.
  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  )
  values (
    gen_random_uuid(), uid, uid::text, 'email',
    jsonb_build_object('sub', uid::text, 'email', test_email, 'email_verified', true),
    now(), now(), now()
  );

  -- Daftarkan sebagai operator.
  insert into public.admin_users (user_id, email) values (uid, test_email);

  raise notice 'Akun uji dibuat: %', test_email;
end;
$$;

select 'akun uji siap' as status,
       u.email,
       (a.user_id is not null) as terdaftar_operator,
       (u.email_confirmed_at is not null) as email_terkonfirmasi
from auth.users u
left join public.admin_users a on a.user_id = u.id
where u.email = 'uji-sesi@desasoulowe.test';
