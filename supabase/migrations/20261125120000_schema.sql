-- Fase 2, BE-03 sampai BE-05: skema inti.
-- Konvensi mengikuti docs/frontend-contract.md:
--   * id uuid, bukan id deskriptif milik fixture
--   * tanggal kegiatan ISO date, timestamp UTC timestamptz
--   * value null berarti "tidak tersedia", berbeda dari 0
--   * tahun statistik/keuangan dikunci 2026 pada MVP
--   * satuan disimpan eksplisit, bukan disimpulkan dari label

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helper: jaga updated_at tetap benar tanpa bergantung pada aplikasi.
-- Nama diberi awalan _ karena fungsi trigger tidak dipanggil langsung.
-- ---------------------------------------------------------------------------
create or replace function public._touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- media_assets: metadata Supabase Storage. Tidak menyimpan biner.
-- ---------------------------------------------------------------------------
create table public.media_assets (
  id            uuid primary key default gen_random_uuid(),
  storage_path  text not null unique,
  mime_type     text not null,
  byte_size     integer not null,
  width         integer,
  height        integer,
  alt           text not null default '',
  is_dummy      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint media_assets_path_shape check (storage_path !~ '(^/|\.\.)'),
  constraint media_assets_mime_allowed check (
    mime_type in ('image/jpeg', 'image/png', 'image/webp')
  ),
  -- 5 MB per file, sama dengan batas UI dan kontrak.
  constraint media_assets_size_limit check (byte_size > 0 and byte_size <= 5 * 1024 * 1024),
  constraint media_assets_dimensions check (
    (width is null or width > 0) and (height is null or height > 0)
  )
);

create trigger media_assets_touch
  before update on public.media_assets
  for each row execute function public._touch_updated_at();

-- ---------------------------------------------------------------------------
-- Singleton: satu baris, dijaga oleh primary key boolean.
-- ---------------------------------------------------------------------------
create table public.site_settings (
  id              boolean primary key default true,
  logo_media_id   uuid references public.media_assets(id) on delete restrict,
  hero_media_id   uuid references public.media_assets(id) on delete restrict,
  updated_at      timestamptz not null default now(),

  constraint site_settings_singleton check (id)
);

create trigger site_settings_touch
  before update on public.site_settings
  for each row execute function public._touch_updated_at();

create table public.principal_profile (
  id              boolean primary key default true,
  name            text not null,
  greeting        text not null,
  photo_media_id  uuid references public.media_assets(id) on delete restrict,
  is_dummy        boolean not null default false,
  updated_at      timestamptz not null default now(),

  constraint principal_profile_singleton check (id),
  constraint principal_profile_name_len check (char_length(btrim(name)) between 1 and 120)
);

create trigger principal_profile_touch
  before update on public.principal_profile
  for each row execute function public._touch_updated_at();

create table public.service_contacts (
  id          boolean primary key default true,
  phone       text not null,
  message     text not null default '',
  is_dummy    boolean not null default false,
  updated_at  timestamptz not null default now(),

  constraint service_contacts_singleton check (id),
  -- Nomor ternormalisasi: 62 diikuti 8..13 digit. Nomor lokal 08.. ditolak
  -- supaya wa.me selalu mendapat format internasional.
  constraint service_contacts_phone_shape check (phone ~ '^62[0-9]{8,13}$')
);

create trigger service_contacts_touch
  before update on public.service_contacts
  for each row execute function public._touch_updated_at();

-- ---------------------------------------------------------------------------
-- Pemerintahan
-- ---------------------------------------------------------------------------
create table public.village_officials (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  role            text not null,
  education       text,
  photo_media_id  uuid references public.media_assets(id) on delete restrict,
  display_order   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint village_officials_name_len check (char_length(btrim(name)) between 1 and 120),
  constraint village_officials_role_len check (char_length(btrim(role)) between 1 and 120)
);

create index village_officials_order_idx on public.village_officials (display_order, name);

-- Natural key: nama dan jabatan yang sama tidak perlu muncul dua kali.
create unique index village_officials_natural_key
  on public.village_officials (name, role);

create trigger village_officials_touch
  before update on public.village_officials
  for each row execute function public._touch_updated_at();

create table public.bpd_members (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  role            text not null,
  photo_media_id  uuid references public.media_assets(id) on delete restrict,
  display_order   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint bpd_members_name_len check (char_length(btrim(name)) between 1 and 120),
  constraint bpd_members_role_len check (char_length(btrim(role)) between 1 and 120)
);

create index bpd_members_order_idx on public.bpd_members (display_order, name);

create unique index bpd_members_natural_key
  on public.bpd_members (name, role);

create trigger bpd_members_touch
  before update on public.bpd_members
  for each row execute function public._touch_updated_at();

-- ---------------------------------------------------------------------------
-- Statistik: agregat saja, tanpa data individu. Tahun dikunci 2026 (MVP).
-- ---------------------------------------------------------------------------
create table public.statistics (
  id            uuid primary key default gen_random_uuid(),
  year          integer not null default 2026,
  category      text not null,
  label         text not null,
  value         numeric(14, 2),
  unit          text not null,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint statistics_year_mvp check (year = 2026),
  constraint statistics_category_allowed check (
    category in ('Kependudukan', 'Pendidikan', 'Mata pencaharian')
  ),
  constraint statistics_label_len check (char_length(btrim(label)) between 1 and 120),
  constraint statistics_unit_allowed check (unit in ('jiwa', 'KK', 'RTM', 'orang', 'unit', 'km')),
  -- Null berarti tidak tersedia. Nilai nyata tidak boleh negatif.
  constraint statistics_value_nonneg check (value is null or value >= 0),
  -- Kependudukan/pendidikan/pekerjaan dihitung dalam orang/KK/RTM, jadi
  -- pecahan tidak bermakna di sana. Panjang jalan (km) justru boleh desimal.
  constraint statistics_integer_when_counted check (
    value is null
    or unit = 'km'
    or value = trunc(value)
  )
);

create unique index statistics_label_unique
  on public.statistics (year, category, label);

create index statistics_order_idx on public.statistics (category, display_order);

create trigger statistics_touch
  before update on public.statistics
  for each row execute function public._touch_updated_at();

-- ---------------------------------------------------------------------------
-- Sarana dan prasarana
-- ---------------------------------------------------------------------------
create table public.facilities (
  id              uuid primary key default gen_random_uuid(),
  category        text not null,
  name            text not null,
  value           numeric(14, 2),
  unit            text not null default 'unit',
  condition       text,
  note            text,
  photo_media_id  uuid references public.media_assets(id) on delete restrict,
  display_order   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint facilities_category_len check (char_length(btrim(category)) between 1 and 120),
  constraint facilities_name_len check (char_length(btrim(name)) between 1 and 180),
  constraint facilities_unit_allowed check (unit in ('unit', 'orang', 'km')),
  constraint facilities_value_nonneg check (value is null or value >= 0),
  constraint facilities_integer_when_counted check (
    value is null or unit = 'km' or value = trunc(value)
  )
);

create index facilities_order_idx on public.facilities (category, display_order, name);

create unique index facilities_natural_key
  on public.facilities (category, name);

create trigger facilities_touch
  before update on public.facilities
  for each row execute function public._touch_updated_at();

-- ---------------------------------------------------------------------------
-- Keuangan: nilai mengikuti dokumen. Tidak ada total/surplus/defisit turunan.
-- ---------------------------------------------------------------------------
create table public.financial_data (
  id            uuid primary key default gen_random_uuid(),
  year          integer not null default 2026,
  category      text not null,
  name          text not null,
  value         numeric(14, 2),
  source_note   text,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint financial_data_year_mvp check (year = 2026),
  constraint financial_data_category_allowed check (category in ('Pendapatan', 'Belanja')),
  constraint financial_data_name_len check (char_length(btrim(name)) between 1 and 180),
  constraint financial_data_value_nonneg check (value is null or value >= 0)
);

create unique index financial_data_name_unique
  on public.financial_data (year, category, name);

create index financial_data_order_idx on public.financial_data (category, display_order);

create trigger financial_data_touch
  before update on public.financial_data
  for each row execute function public._touch_updated_at();

-- ---------------------------------------------------------------------------
-- Berita: langsung terbit. Tidak ada kolom draft/approval/hidden.
-- ---------------------------------------------------------------------------
create table public.news (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  slug           text not null unique,
  category       text,
  published_on   date not null,
  author         text,
  summary        text not null default '',
  body           text not null default '',
  cover_media_id uuid references public.media_assets(id) on delete restrict,
  is_dummy       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint news_title_len check (char_length(btrim(title)) between 1 and 180),
  constraint news_slug_shape check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint news_slug_len check (char_length(slug) between 1 and 200)
);

create index news_published_idx on public.news (published_on desc, created_at desc);

create trigger news_touch
  before update on public.news
  for each row execute function public._touch_updated_at();

create table public.news_images (
  id            uuid primary key default gen_random_uuid(),
  news_id       uuid not null references public.news(id) on delete cascade,
  media_id      uuid not null references public.media_assets(id) on delete restrict,
  alt           text not null default '',
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),

  constraint news_images_unique_media unique (news_id, media_id)
);

create index news_images_order_idx on public.news_images (news_id, display_order);

-- ---------------------------------------------------------------------------
-- Galeri: album dengan banyak foto dan satu foto unggulan.
-- ---------------------------------------------------------------------------
create table public.gallery_albums (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text not null unique,
  event_date     date not null,
  description    text not null default '',
  cover_media_id uuid references public.media_assets(id) on delete restrict,
  is_dummy       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint gallery_albums_name_len check (char_length(btrim(name)) between 1 and 180),
  constraint gallery_albums_slug_shape check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint gallery_albums_slug_len check (char_length(slug) between 1 and 200)
);

create index gallery_albums_date_idx on public.gallery_albums (event_date desc);

create trigger gallery_albums_touch
  before update on public.gallery_albums
  for each row execute function public._touch_updated_at();

create table public.gallery_images (
  id            uuid primary key default gen_random_uuid(),
  album_id      uuid not null references public.gallery_albums(id) on delete cascade,
  media_id      uuid not null references public.media_assets(id) on delete restrict,
  alt           text not null default '',
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),

  constraint gallery_images_unique_media unique (album_id, media_id)
);

create index gallery_images_order_idx on public.gallery_images (album_id, display_order);

-- Foto unggulan harus benar-benar milik album tersebut. Dijaga dengan trigger
-- karena foreign key biasa tidak bisa menyatakan syarat lintas tabel ini.
create or replace function public.assert_album_cover_belongs()
returns trigger
language plpgsql
as $$
begin
  if new.cover_media_id is not null then
    if not exists (
      select 1 from public.gallery_images
      where album_id = new.id and media_id = new.cover_media_id
    ) then
      raise exception 'cover_media_id harus salah satu foto pada album ini'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger gallery_albums_cover_check
  before insert or update of cover_media_id on public.gallery_albums
  for each row execute function public.assert_album_cover_belongs();
