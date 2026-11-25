# Kontrak data awal — handoff Fase 1 ke Fase 2

Status: **rancangan**, bukan API yang sudah diimplementasikan. TypeScript acuan: `src/lib/types.ts`. Backend harus memvalidasi kembali semua field; validasi frontend bukan kontrol keamanan.

## Konvensi

- ID string UUID pada backend; fixture memakai ID deskriptif.
- Waktu kegiatan/publikasi: tanggal ISO `YYYY-MM-DD`; timestamp database UTC ISO-8601.
- `tahun` statistik/keuangan 2026; tidak dapat dipilih operator pada MVP.
- `value: null` berarti tidak tersedia, berbeda dari `0`. Tampilan null `—`; nilai tersimpan numerik, bukan string Rupiah.
- Jumlah nonnegatif; kependudukan/pendidikan/pekerjaan bilangan bulat; panjang jalan boleh desimal. Satuan eksplisit `jiwa`, `KK`, `RTM`, `orang`, `unit`, `km`.
- `created_at` / `updated_at` ditambahkan pada record dinamis yang relevan oleh backend.
- Relasi foto pada fixture menggunakan URL. Backend memakai referensi `media_assets` dengan URL baca publik yang sesuai policy, bukan data URL upload lokal.
- Mock generik `Entry` memudahkan UI sementara. Backend perlu schema spesifik setiap resource; jangan menjadikan semua field opsional tanpa validasi.
- Field nama/judul maksimum 180 karakter pada editor; nama Kepala Desa 120. Trim field wajib di server.
- Isi berita pada frontend saat ini plain text dengan paragraf; rendering tidak memakai `{@html}`. Jika nanti memakai rich text, whitelist/sanitasi wajib dan perubahan format harus disepakati sebelum implementasi.
- Slug dibuat dari judul, lowercase dengan tanda hubung, unik per berita/album. Edit judul tidak otomatis mengubah slug existing. Backend menangani collision secara deterministik.
- Berita/album langsung tampil setelah transaksi simpan berhasil; tidak ada field draft/hidden/approval.

## Resource dan operasi

| Resource | Field utama | Baca publik | Operasi operator |
|---|---|---|---|
| Pengaturan situs | logo/hero → media, metadata | Ya, field publik saja | Update singleton |
| Kepala Desa | nama, sambutan, foto opsional | Ya | Update singleton |
| Perangkat | nama, jabatan, pendidikan, foto, urutan | Ya | Create/update/delete |
| BPD | nama, jabatan, foto opsional, urutan | Ya | Create/update/delete |
| Statistik | tahun, kategori, label, nilai nullable, satuan | Ya | Update label/nilai yang disepakati, tanpa data individu |
| Fasilitas | kategori, nama, nilai nullable, satuan, kondisi, catatan, foto | Ya | Create/update/delete |
| Keuangan | tahun, kategori pendapatan/belanja, uraian, nilai nullable, sumber | Ya | Create/update/delete item |
| Berita | judul, slug, kategori, tanggal, penulis opsional, ringkasan, isi, foto utama | Ya | Create/update/delete |
| Foto berita | berita_id → berita, media_id → aset, alt/keterangan, urutan | Bersama berita | Add/update/delete |
| Album | nama, slug, tanggal kegiatan, deskripsi, foto unggulan | Ya | Create/update/delete |
| Foto album | album_id → album, media_id → aset, alt/keterangan, urutan | Bersama album | Add/update/delete, pilih unggulan |
| WhatsApp | nomor ternormalisasi 62…, pesan pembuka | Ya | Update singleton |
| Aset media | path Storage unik, MIME, ukuran, dimensi, alt, penanda dummy | URL media konten publik; metadata internal tidak semuanya publik | Upload/select/replace/delete jika tidak dipakai |
| Dashboard | jumlah berita, jumlah album, tahun 2026 | Tidak diperlukan | Read summary |
| Akun | email operator, session, password | Tidak | Login/logout/change password |

Tidak ada endpoint CRUD konten tetap. Nama tabel dan pemetaan operasi final ditetapkan pada fase backend.

## Rancangan endpoint

Namespace kandidat `/api/public/*` untuk baca dan `/api/admin/*` untuk mutasi/metadata internal. Resource kandidat: `settings`, `principal`, `officials`, `bpd`, `statistics`, `facilities`, `finance`, `news`, `albums`, `contact`, `media`, `dashboard`.

- Daftar: `GET /api/public/news`, `GET /api/public/albums`; detail `GET .../{slug}`.
- Operator: `POST` koleksi, `PATCH .../{id}`, `DELETE .../{id}`; singleton memakai `PATCH`.
- Upload multipart ke endpoint admin media; maksimal 5 MB **setiap file**. Banyak foto didukung UI melalui beberapa file, proses backend menangani kegagalan parsial.
- Auth mengikuti Supabase SSR; endpoint mutasi tidak boleh percaya demoSession client atau field role kiriman browser.
- Pagination koleksi di backend bila diperlukan agar respons tidak tumbuh tanpa batas. Tidak menambahkan fitur filter baru di luar kebutuhan UI tanpa alasan.

## Bentuk respons

```ts
type Result<T> =
  | { data: T; error: null }
  | { data: null; error: {
      code: string;
      message: string;
      fields?: Record<string, string>;
    }};
```

Kode HTTP: 200/201 berhasil; 400/422 validasi; 401 tanpa sesi; 403 bukan operator yang diizinkan; 404 record tidak ditemukan; 409 collision/referensi media; 413 file terlalu besar; 415 tipe file ditolak; 500 error internal tanpa stack/secrets. API harus mengembalikan status benar dan UI tidak boleh mengubah error menjadi mock sukses.

## Media dan konsistensi

- Format JPG/JPEG/PNG/WebP; ukuran ≤5 × 1024 × 1024 byte. Validasi ekstensi, MIME, dan isi file di server.
- Path server dibuat aman/unik; jangan memakai nama upload sebagai path mentah.
- Foto unggulan harus merujuk foto album tersebut. Album minimal satu foto pada UI.
- Penghapusan foto unggulan memilih foto pengganti atau menolak operasi bila melanggar invariant; perilaku final didokumentasikan backend.
- Menghapus berita/album harus menjaga relasi metadata/Storage, tanpa menghapus file bersama yang masih direferensikan konten lain.
- Konfirmasi modal merupakan perlindungan UX, **bukan** pengganti otorisasi server.

## Handoff SEO dan deployment

Frontend memuat title/description/OG, favicon, route 404, robots, serta kerangka sitemap. Integrasi harus mengisi sitemap dinamis, URL OG absolut/canonical domain resmi, dan status HTTP 404 detail yang tidak ditemukan berdasarkan database. Domain belum ditetapkan. Admin selalu noindex dan dikeluarkan dari sitemap.

## Pembaruan Fase 2 (25 November 2026): kontrak sudah menjadi skema nyata

BE-01 selesai. Rancangan di atas diterjemahkan menjadi migration yang dapat dijalankan, dengan beberapa perbedaan yang disengaja:

| Rancangan awal | Skema nyata | Alasan |
|---|---|---|
| ID string UUID | `uuid` dengan `gen_random_uuid()` | Konsisten dengan Supabase dan menghindari tabrakan |
| `tahun` bebas | `check (year = 2026)` pada `statistics` dan `financial_data` | MVP hanya 2026, ditegakkan database bukan hanya UI |
| Nilai tidak tersedia | `value numeric` nullable, tanpa default | `null` tetap berbeda dari `0`, sesuai kontrak |
| Satuan bebas | `check (unit in (...))` per tabel | Mencegah satuan karangan seperti "jiwa2" |
| Foto unggulan album | Trigger `assert_album_cover_belongs` | Foreign key biasa tidak bisa menyatakan syarat lintas tabel |
| Urutan tampil | `display_order integer` | Dipertahankan, diindeks bersama kategori |
| Nama tabel `bpd_members` | Sama, ditambah unique `(name, role)` | Seed aman dijalankan ulang |

Tambahan yang tidak ada di rancangan awal:

- Tabel `admin_users` sebagai daftar operator eksplisit (BE-10). Tanpa baris di sini, semua operasi tulis ditolak RLS meski sesi valid.
- Fungsi `public.is_operator()` ber-`security definer` agar policy tabel lain bisa memeriksa keanggotaan operator tanpa membuka isi `admin_users` ke klien.
- Trigger `_touch_updated_at()` pada setiap tabel yang punya `updated_at`.
- Bucket Storage `media` dengan batas 5 MB dan whitelist MIME yang sama dengan validasi UI.

Verifikasi struktur: `bun run test:sql` (9 pemeriksaan). Ini pemeriksaan statis, bukan pengganti eksekusi SQL sungguhan. Cara menjalankan: `docs/backend-setup.md`.
