-- Fase 2, BE-11: RLS dan policy Storage.
-- Prinsip: publik hanya membaca konten publik; tulis hanya untuk akun operator
-- yang terdaftar di admin_users. Membaca tabel tidak pernah membuka data akun.
--
-- Catatan penting: service role key melewati RLS sepenuhnya. Policy di bawah
-- melindungi jalur anon dan authenticated, bukan jalur service role. Jangan
-- memakai service role untuk melayani request pengguna (BE-12).

-- ---------------------------------------------------------------------------
-- Daftar operator. Satu akun pada MVP, tetapi tabel memudahkan audit dan
-- memungkinkan penambahan terkontrol tanpa mengubah policy.
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now()
);

-- Hanya service role yang boleh membaca daftar operator. Tidak ada policy
-- select untuk anon/authenticated, jadi RLS menolak semua akses klien.
alter table public.admin_users enable row level security;

-- ---------------------------------------------------------------------------
-- Helper: apakah pemanggil adalah operator terdaftar.
-- security definer supaya policy tabel lain bisa memeriksa admin_users tanpa
-- memberi hak baca tabel itu kepada pemanggil.
-- ---------------------------------------------------------------------------
create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_operator() from public;
grant execute on function public.is_operator() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tabel konten: baca publik, tulis operator.
-- ---------------------------------------------------------------------------
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
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_public_read', t
    );

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_operator())',
      t || '_operator_insert', t
    );

    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_operator()) with check (public.is_operator())',
      t || '_operator_update', t
    );

    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_operator())',
      t || '_operator_delete', t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage: bucket media publik, tulis hanya operator.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy media_public_read
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');

create policy media_operator_insert
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_operator());

create policy media_operator_update
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_operator())
  with check (bucket_id = 'media' and public.is_operator());

create policy media_operator_delete
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_operator());
