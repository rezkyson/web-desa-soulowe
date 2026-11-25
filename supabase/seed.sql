-- Fase 2, BE-06: seed yang aman dijalankan ulang.
-- Semua insert memakai on conflict do nothing/update sehingga menjalankan file
-- ini dua kali tidak menggandakan data dan tidak menimpa konten operator.
--
-- Angka diambil dari dokumen profil Desa Soulowe 2025-2026 lewat fixture
-- src/lib/mock/seed.ts. Tidak ada total turunan, surplus, atau defisit.
-- value null berarti "tidak tersedia pada dokumen", bukan nol.

begin;

-- ---------------------------------------------------------------------------
-- Media contoh. File fisik harus diunggah ke Storage bucket `media` dengan
-- path yang sama, atau baris ini dilewati. Seed tidak mengunggah biner.
-- ---------------------------------------------------------------------------
insert into public.media_assets (storage_path, mime_type, byte_size, alt, is_dummy)
values
  ('images/landscape.jpg', 'image/jpeg', 279441, 'Ilustrasi lanskap pedesaan', true),
  ('images/field.jpg',     'image/jpeg', 163237, 'Ilustrasi lahan pertanian', true),
  ('images/fields.jpg',    'image/jpeg', 513174, 'Ilustrasi hasil panen sayur', true),
  ('images/seedlings.jpg', 'image/jpeg', 501767, 'Ilustrasi bibit tanaman', true),
  ('images/logo.png',      'image/png',  133559, 'Lambang Kabupaten Sigi', false)
on conflict (storage_path) do nothing;

-- ---------------------------------------------------------------------------
-- Singleton
-- ---------------------------------------------------------------------------
insert into public.site_settings (id, logo_media_id, hero_media_id)
select true, l.id, h.id
from public.media_assets l, public.media_assets h
where l.storage_path = 'images/logo.png'
  and h.storage_path = 'images/landscape.jpg'
on conflict (id) do nothing;

insert into public.principal_profile (id, name, greeting, is_dummy)
values (
  true,
  'Kepala Desa Soulowe',
  'Selamat datang di website Desa Soulowe. Ruang informasi ini kami hadirkan agar masyarakat dapat mengenal desa, mengakses data, dan mengikuti kabar desa dengan lebih mudah. Mari bersama menjaga kebersamaan dan membangun desa dengan semangat pelayanan.'
    || E'\n\n' ||
    'Sambutan ini adalah teks sementara untuk pengembangan dan akan diganti dengan sambutan resmi Kepala Desa.',
  true
)
on conflict (id) do nothing;

-- Nomor dummy. Ganti dengan nomor resmi sebelum publikasi (DP-03).
insert into public.service_contacts (id, phone, message, is_dummy)
values (
  true,
  '6281234567890',
  'Halo Pemerintah Desa Soulowe, saya ingin mendapatkan informasi.',
  true
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Pemerintahan
-- ---------------------------------------------------------------------------
insert into public.village_officials (name, role, education, display_order)
values
  ('Harjan',        'Sekretaris Desa (Non PNS)',      'SMA', 1),
  ('Fiska',         'Kepala Urusan Keuangan',          'S1',  2),
  ('Sri Ayu',       'Kepala Seksi Kesejahteraan',      'SMA', 3),
  ('Yolan',         'Kepala Urusan Umum',              'SMK', 4),
  ('Wiwin Safitri', 'Kepala Seksi Pemerintahan',       'SMK', 5),
  ('Trisna Ningsi', 'Kepala Seksi Pelayanan',          'SMK', 6),
  ('Darlin',        'Kepala Dusun I',                  null,  7),
  ('Sumarlin',      'Kepala Dusun II',                 null,  8)
on conflict (name, role) do nothing;

insert into public.bpd_members (name, role, display_order)
values
  ('Moh Zaman', 'Ketua',   1),
  ('Indopai',   'Anggota', 2)
on conflict (name, role) do nothing;

-- ---------------------------------------------------------------------------
-- Statistik 2026 (agregat, tanpa data individu)
-- ---------------------------------------------------------------------------
insert into public.statistics (year, category, label, value, unit, display_order)
values
  (2026, 'Kependudukan', 'Total penduduk',           1127, 'jiwa', 1),
  (2026, 'Kependudukan', 'Laki-laki',                 563, 'jiwa', 2),
  (2026, 'Kependudukan', 'Perempuan',                 564, 'jiwa', 3),
  (2026, 'Kependudukan', 'Kepala keluarga',           362, 'KK',   4),
  (2026, 'Kependudukan', 'Rumah tangga miskin',        76, 'RTM',  5),

  (2026, 'Pendidikan', 'Taman Kanak-Kanak',            43, 'orang', 1),
  (2026, 'Pendidikan', 'Tidak tamat SD/Sederajat',    325, 'orang', 2),
  (2026, 'Pendidikan', 'Tamat SD/Sederajat',          334, 'orang', 3),
  (2026, 'Pendidikan', 'Tamat SLTP',                  152, 'orang', 4),
  (2026, 'Pendidikan', 'Tamat SLTA',                  255, 'orang', 5),
  (2026, 'Pendidikan', 'Tamat D1',                      7, 'orang', 6),
  (2026, 'Pendidikan', 'Tamat D2',                   null, 'orang', 7),
  (2026, 'Pendidikan', 'Tamat D3',                   null, 'orang', 8),
  (2026, 'Pendidikan', 'Tamat S1',                     11, 'orang', 9),
  (2026, 'Pendidikan', 'Tamat S2',                   null, 'orang', 10),

  (2026, 'Mata pencaharian', 'Petani',                339, 'orang', 1),
  (2026, 'Mata pencaharian', 'Pedagang/Pengusaha',     19, 'orang', 2),
  (2026, 'Mata pencaharian', 'Buruh tani',            537, 'orang', 3),
  (2026, 'Mata pencaharian', 'Buruh harian lepas',    162, 'orang', 4),
  (2026, 'Mata pencaharian', 'Pertukangan',            19, 'orang', 5),
  (2026, 'Mata pencaharian', 'Peternak',               29, 'orang', 6),
  (2026, 'Mata pencaharian', 'PNS/Honorer',            16, 'orang', 7),
  (2026, 'Mata pencaharian', 'Polri',                null, 'orang', 8),
  (2026, 'Mata pencaharian', 'TNI',                     6, 'orang', 9),
  (2026, 'Mata pencaharian', 'Karyawan swasta',      null, 'orang', 10),
  (2026, 'Mata pencaharian', 'Karyawan BUMN',        null, 'orang', 11),
  (2026, 'Mata pencaharian', 'Pembantu rumah tangga', null, 'orang', 12),
  (2026, 'Mata pencaharian', 'TKI/TKW luar negeri',  null, 'orang', 13),
  (2026, 'Mata pencaharian', 'Pengemudi/Tukang ojek', null, 'orang', 14)
on conflict (year, category, label) do nothing;

-- ---------------------------------------------------------------------------
-- Sarana dan prasarana
-- ---------------------------------------------------------------------------
insert into public.facilities (category, name, value, unit, condition, note, display_order)
values
  ('Sarana pendidikan', 'TK/PAUD',      2, 'unit', null, 'Sumber: dokumen profil desa', 1),
  ('Sarana pendidikan', 'Sekolah Dasar', 3, 'unit', null, 'Sumber: dokumen profil desa', 2),
  ('Sarana pendidikan', 'SLTP',         1, 'unit', null, 'Sumber: dokumen profil desa', 3),
  ('Sarana pendidikan', 'SLTA',         1, 'unit', null, 'Sumber: dokumen profil desa', 4),
  ('Sarana pendidikan', 'Universitas',  0, 'unit', null, 'Sumber: dokumen profil desa', 5),

  ('Keamanan', 'Pos Kamling',      2, 'unit',  null, 'Sumber: dokumen profil desa', 1),
  ('Keamanan', 'Hansip/LINMAS',    5, 'orang', null, 'Sumber: dokumen profil desa', 2),
  ('Keamanan', 'Polmas',           1, 'orang', null, 'Sumber: dokumen profil desa', 3),
  ('Keamanan', 'Babinkamtibmas',   1, 'orang', null, 'Sumber: dokumen profil desa', 4),

  ('Jalan', 'Jalan Provinsi',  null, 'km', null, 'Sumber: dokumen profil desa', 1),
  ('Jalan', 'Jalan Kabupaten',  2.5, 'km', null, 'Sumber: dokumen profil desa', 2),
  ('Jalan', 'Jalan Desa',        10, 'km', null, 'Sumber: dokumen profil desa', 3),
  ('Jalan', 'Jalan Dusun',      3.3, 'km', null, 'Sumber: dokumen profil desa', 4),

  ('Sarana umum', 'Masjid',                    2, 'unit', null, 'Sumber: dokumen profil desa', 1),
  ('Sarana umum', 'Polindes/Poskesdes',        1, 'unit', null, 'Sumber: dokumen profil desa', 2),
  ('Sarana umum', 'Lapangan sepak bola',       1, 'unit', null, 'Sumber: dokumen profil desa', 3),
  ('Sarana umum', 'Lapangan badminton',        1, 'unit', null, 'Sumber: dokumen profil desa', 4),
  ('Sarana umum', 'Tempat pembuangan sampah',  7, 'unit', null, 'Sumber: dokumen profil desa', 5),
  ('Sarana umum', 'Telepon umum pedesaan',  null, 'unit', null, 'Sumber: dokumen profil desa', 6),

  ('Pemerintahan', 'Gedung kantor desa', 1, 'unit', 'Kurang baik', 'Sumber: dokumen profil desa', 1),
  ('Pemerintahan', 'Gedung BPD',         1, 'unit', 'Kurang baik', 'Sumber: dokumen profil desa', 2),
  ('Pemerintahan', 'Komputer',           1, 'unit', 'Kurang baik', 'Sumber: dokumen profil desa', 3),
  ('Pemerintahan', 'Meja kerja',         6, 'unit', 'Baik',        'Sumber: dokumen profil desa', 4),
  ('Pemerintahan', 'Kursi kerja',        8, 'unit', 'Baik',        'Sumber: dokumen profil desa', 5),
  ('Pemerintahan', 'Kursi rapat',       75, 'unit', 'Baik',        'Sumber: dokumen profil desa', 6)
on conflict (category, name) do nothing;

-- ---------------------------------------------------------------------------
-- Keuangan 2026. Nilai mengikuti dokumen apa adanya.
-- ---------------------------------------------------------------------------
insert into public.financial_data (year, category, name, value, source_note, display_order)
values
  (2026, 'Pendapatan', 'Pendapatan Asli Desa',              null, 'Dokumen profil Desa Soulowe 2026', 1),
  (2026, 'Pendapatan', 'Pendapatan transfer',           633307300, 'Dokumen profil Desa Soulowe 2026', 2),
  (2026, 'Pendapatan', 'Dana Desa',                     259252000, 'Dokumen profil Desa Soulowe 2026', 3),
  (2026, 'Pendapatan', 'Alokasi Dana Desa',             374055300, 'Dokumen profil Desa Soulowe 2026', 4),
  (2026, 'Pendapatan', 'Bantuan keuangan',                   null, 'Dokumen profil Desa Soulowe 2026', 5),
  (2026, 'Pendapatan', 'Pendapatan lain-lain',               null, 'Dokumen profil Desa Soulowe 2026', 6),

  (2026, 'Belanja', 'Penyelenggaraan Pemerintah Desa',  329945000, 'Dokumen profil Desa Soulowe 2026', 1),
  (2026, 'Belanja', 'Pelaksanaan Pembangunan Desa',     364223660, 'Dokumen profil Desa Soulowe 2026', 2),
  (2026, 'Belanja', 'Pembinaan Kemasyarakatan Desa',     37400000, 'Dokumen profil Desa Soulowe 2026', 3),
  (2026, 'Belanja', 'Pemberdayaan Kemasyarakatan Desa', 188951600, 'Dokumen profil Desa Soulowe 2026', 4),
  (2026, 'Belanja', 'Penanggulangan Bencana, Darurat dan Mendesak Desa', 113000000, 'Dokumen profil Desa Soulowe 2026', 5)
on conflict (year, category, name) do nothing;

-- ---------------------------------------------------------------------------
-- Berita contoh. Ditandai is_dummy supaya UI tetap memberi pemberitahuan.
-- ---------------------------------------------------------------------------
insert into public.news (title, slug, category, published_on, author, summary, body, cover_media_id, is_dummy)
select v.title, v.slug, v.category, v.published_on::date, v.author, v.summary, v.body, m.id, true
from (values
  ('Mengenal pertanian dan kehidupan masyarakat Soulowe',
   'mengenal-pertanian-soulowe',
   'Kabar Desa', '2026-11-18', 'Operator Desa',
   'Sekilas tentang pertanian sebagai bagian penting dari kehidupan dan mata pencaharian warga.',
   'Soulowe merupakan desa agraris. Dokumen profil tahun 2026 mencatat buruh tani dan petani sebagai mata pencaharian yang paling dominan.',
   'images/field.jpg'),
  ('Informasi desa yang lebih dekat dengan masyarakat',
   'informasi-desa-untuk-masyarakat',
   'Informasi', '2026-11-14', 'Operator Desa',
   'Profil, data agregat, dan informasi pemerintah desa dalam satu ruang yang mudah diakses.',
   'Website ini disiapkan untuk memudahkan akses informasi Desa Soulowe. Informasi yang disajikan meliputi profil, pemerintahan, statistik, dan keuangan.',
   'images/landscape.jpg'),
  ('Membaca profil dan data Desa Soulowe tahun 2026',
   'profil-dan-data-soulowe-2026',
   'Data Desa', '2026-11-10', 'Operator Desa',
   'Mengenal desa lewat informasi kependudukan, pendidikan, dan sarana-prasarana.',
   'Data agregat membantu masyarakat memahami gambaran desa tanpa membuka data pribadi penduduk.',
   'images/landscape.jpg')
) as v(title, slug, category, published_on, author, summary, body, cover_path)
left join public.media_assets m on m.storage_path = v.cover_path
where true
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Album contoh dengan foto dan unggulan.
-- ---------------------------------------------------------------------------
insert into public.gallery_albums (name, slug, event_date, description, is_dummy)
values
  ('Lanskap dan suasana desa', 'lanskap-dan-suasana-desa', '2026-11-18',
   'Album contoh untuk meninjau tampilan dokumentasi. Foto ilustrasi, bukan dokumentasi Desa Soulowe.', true),
  ('Pertanian dan keseharian', 'pertanian-dan-keseharian', '2026-11-12',
   'Contoh album dengan foto ilustrasi pertanian untuk tahap pengembangan.', true)
on conflict (slug) do nothing;

insert into public.gallery_images (album_id, media_id, alt, display_order)
select a.id, m.id, v.alt, v.ord
from (values
  ('lanskap-dan-suasana-desa', 'images/landscape.jpg', 'Ilustrasi lanskap pedesaan', 1),
  ('lanskap-dan-suasana-desa', 'images/field.jpg',     'Ilustrasi lahan pertanian', 2),
  ('lanskap-dan-suasana-desa', 'images/seedlings.jpg', 'Ilustrasi bibit tanaman di persemaian', 3),
  ('pertanian-dan-keseharian', 'images/field.jpg',     'Ilustrasi pertanian', 1),
  ('pertanian-dan-keseharian', 'images/fields.jpg',    'Ilustrasi hasil panen sayur di pasar', 2)
) as v(slug, path, alt, ord)
join public.gallery_albums a on a.slug = v.slug
join public.media_assets m on m.storage_path = v.path
where true
on conflict (album_id, media_id) do nothing;

-- Tetapkan unggulan setelah fotonya ada, karena trigger memeriksa keanggotaan.
update public.gallery_albums a
set cover_media_id = m.id
from public.media_assets m
where m.storage_path = 'images/landscape.jpg'
  and a.slug = 'lanskap-dan-suasana-desa'
  and a.cover_media_id is null;

update public.gallery_albums a
set cover_media_id = m.id
from public.media_assets m
where m.storage_path = 'images/field.jpg'
  and a.slug = 'pertanian-dan-keseharian'
  and a.cover_media_id is null;

commit;
