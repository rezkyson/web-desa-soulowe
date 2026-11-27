-- Perbaikan sekali jalan untuk database yang sudah berisi data seed lama.
--
-- Masalah: baris media `images/logo.png` ditandai is_dummy = false padahal
-- berkasnya adalah logo bawaan aplikasi di folder `static/`, bukan unggahan
-- operator ke Storage. Akibatnya aplikasi mencari logo di bucket `media` dan
-- gambarnya gagal dimuat di seluruh halaman publik.
--
-- Jalankan sekali di SQL Editor. Aman diulang.

update public.media_assets
set is_dummy = true
where storage_path in (
  'images/landscape.jpg', 'images/field.jpg', 'images/fields.jpg',
  'images/seedlings.jpg', 'images/logo.png'
);

select storage_path, is_dummy, alt
from public.media_assets
order by storage_path;
