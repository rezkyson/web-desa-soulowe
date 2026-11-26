-- Akun uji sementara, versi kedua.
--
-- Versi pertama gagal: GoTrue mengembalikan 500 "Database error querying
-- schema" karena kolom token pada auth.users dibiarkan null. GoTrue membaca
-- kolom itu sebagai string, jadi null membuat query-nya gagal.
--
-- Jalankan seluruh blok ini sekali di SQL Editor. Akun lama dihapus lebih dulu.

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  uid uuid := gen_random_uuid();
  test_email text := 'uji-sesi@desasoulowe.test';
  test_password text := 'UjiSesiSementara2026!';
  now_ts timestamptz := now();
begin
  -- Bersihkan sisa percobaan sebelumnya (identities ikut terhapus lewat cascade).
  delete from public.admin_users where email = test_email;
  delete from auth.identities where provider_id = test_email;
  delete from auth.users where email = test_email;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change,
    email_change_token_current, email_change_confirm_status,
    phone_change, phone_change_token, reauthentication_token,
    raw_app_meta_data, raw_user_meta_data,
    is_sso_user, is_anonymous
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    uid,
    'authenticated', 'authenticated',
    test_email,
    extensions.crypt(test_password, extensions.gen_salt('bf')),
    now_ts, now_ts, now_ts,
    '', '', '', '',
    '', 0,
    '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false, false
  );

  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  )
  values (
    gen_random_uuid(), uid, uid::text, 'email',
    jsonb_build_object('sub', uid::text, 'email', test_email, 'email_verified', true),
    now_ts, now_ts, now_ts
  );

  insert into public.admin_users (user_id, email) values (uid, test_email);
end;
$$;

select 'akun uji siap' as status,
       u.email,
       (a.user_id is not null) as terdaftar_operator,
       (u.email_confirmed_at is not null) as email_terkonfirmasi,
       length(u.encrypted_password) as panjang_hash,
       left(u.encrypted_password, 7) as awalan_hash
from auth.users u
left join public.admin_users a on a.user_id = u.id
where u.email = 'uji-sesi@desasoulowe.test';
