# Kontrak API backend

Dokumen ini mencatat endpoint yang benar-benar ada di kode, bukan rencana.
Sumbernya `src/lib/server/api-*.ts` dan `src/routes/api/**/+server.ts`.

## Bentuk respons

Semua endpoint memakai satu bentuk, baik berhasil maupun gagal:

```json
{ "data": { }, "error": null }
```

```json
{ "data": null, "error": { "code": "validation_error", "message": "…", "fields": { "title": "Wajib diisi." } } }
```

`fields` hanya muncul pada kesalahan validasi, supaya UI bisa menandai isian
yang salah tanpa menebak dari teks pesan.

Kode error yang dipakai:

| Kode | Status | Arti |
|---|---|---|
| `invalid_body` | 400 | Body bukan JSON objek |
| `validation_error` | 422 | Ada isian tidak valid, lihat `fields` |
| `invalid_credentials` | 401 | Email/password salah, atau password lama salah |
| `no_session` | 401 | Belum ada sesi |
| `not_operator` | 403 | Ada sesi, tetapi akun tidak terdaftar di `admin_users` |
| `not_found` | 404 | Data tidak ada |
| `duplicate_photo` | 409 | Foto itu sudah ada di album |
| `photo_is_cover` | 409 | Foto unggulan tidak boleh dihapus |
| `media_in_use` | 409 | Media masih dipakai konten lain |
| `file_too_large` | 413 | Lebih dari 5 MB |
| `unsupported_type` | 415 | Bukan JPG/PNG/WebP |
| `cover_not_in_album` | 422 | Foto unggulan bukan milik album itu |
| `weak_password` | 422 | Password baru ditolak Supabase |
| `internal_error` | 500 | Kesalahan tak terduga, detail tidak dibocorkan |
| `unavailable` | 503 | Konfigurasi Supabase belum lengkap |

## API publik (tanpa sesi)

Prefix `/api/public`. Semua memakai klien anon, jadi RLS tetap berlaku.
Tidak ada satu pun endpoint tulis di sini.

| Method | Path | Isi |
|---|---|---|
| GET | `/api/public/settings` | Logo dan hero (storage_path, alt) |
| GET | `/api/public/principal` | Nama, sambutan, foto Kepala Desa |
| GET | `/api/public/officials` | Perangkat desa, urut `display_order` lalu nama |
| GET | `/api/public/bpd` | Anggota BPD, urutan sama |
| GET | `/api/public/statistics` | Statistik tahun 2026, urut kategori lalu `display_order` |
| GET | `/api/public/facilities` | Sarana prasarana |
| GET | `/api/public/finance` | Keuangan 2026, tanpa total/surplus/defisit |
| GET | `/api/public/contact` | Nomor WhatsApp dan pesan layanan |
| GET | `/api/public/news` | 20 berita terbaru, tanpa `body` |
| GET | `/api/public/news/:slug` | Satu berita lengkap dengan `body` dan `images` |
| GET | `/api/public/albums` | Album dengan jumlah foto |
| GET | `/api/public/albums/:slug` | Album dengan semua foto, ditandai `featured` |

Catatan yang mudah salah dipahami:

- `/settings`, `/principal`, dan `/contact` adalah **singleton**. Kalau barisnya
  belum ada, jawabannya `404 not_found`, bukan objek kosong.
- `/news` mengembalikan maksimal 20 baris. Belum ada paginasi.
- `/albums/:slug` menambahkan `featured: true` pada foto unggulan, supaya UI
  tidak perlu membandingkan `cover_media_id` sendiri.
- `value: null` berarti angka tidak tersedia. Itu berbeda dari `0` dan UI wajib
  membedakannya.

## API auth

Prefix `/api/admin/auth`. Tidak ada endpoint registrasi.

| Method | Path | Body | Berhasil |
|---|---|---|---|
| POST | `/login` | `{ email, password }` | `200 { id, email }` + cookie sesi |
| POST | `/logout` | – | `200 { signedOut: true }` |
| GET | `/session` | – | `200 { id, email }` |
| POST | `/password` | `{ currentPassword, newPassword }` | `200 { updated: true }` |

Aturan yang ditegakkan:

- Login yang gagal selalu `401 invalid_credentials`, tidak membedakan email
  tidak terdaftar dari password salah.
- Login berhasil **belum cukup**: akun harus lolos `is_operator()`, kalau tidak
  sesinya langsung diakhiri dan dijawab `403 not_operator`.
- Ganti password memverifikasi password lama lebih dulu, supaya sesi yang
  terbuka di perangkat lain tidak bisa dipakai mengambil alih akun.
- Password baru minimal 8 karakter dan harus berbeda dari yang lama.

## API admin konten

Prefix `/api/admin`. **Semua** endpoint di bawah memerlukan operator dan
mengembalikan `401 no_session` atau `403 not_operator` bila tidak memenuhi.

| Method | Path | Body utama |
|---|---|---|
| PATCH | `/principal` | `name`, `greeting`, `photoMediaId` |
| PATCH | `/contact` | `phone`, `message` |
| POST | `/officials` | `name`, `role`, `education`, `order` |
| PATCH | `/officials/:id` | sama seperti POST |
| DELETE | `/officials/:id` | – |
| POST | `/bpd` | `name`, `role`, `order` |
| DELETE | `/bpd/:id` | – |
| PATCH | `/statistics/:id` | `label`, `value` |
| POST | `/facilities` | `category`, `name`, `value`, `unit`, `condition`, `note`, `order` |
| DELETE | `/facilities/:id` | – |
| POST | `/finance` | `category`, `name`, `value`, `sourceNote`, `order` |
| DELETE | `/finance/:id` | – |
| GET | `/dashboard` | – (ringkasan jumlah berita dan album) |

Aturan yang ditegakkan:

- `phone` dinormalkan ke format `62…`. `08…`, `8…`, `+62…` diterima; hasilnya
  selalu `62` diikuti 8–13 digit, karena `wa.me` memerlukan format itu.
- Statistik: `value: null` berarti tidak tersedia, `0` berarti nol. Keduanya
  tidak disamakan.
- Tahun tidak bisa diubah lewat API. Constraint database juga menolak selain 2026.
- Keuangan: `category` hanya `Pendapatan` atau `Belanja`. Tidak ada perhitungan
  total, surplus, atau defisit, baik di API maupun di database.
- Konten tetap (sejarah, visi-misi, geografis, iklim, penggunaan lahan, tipologi,
  orbitasi) **tidak punya endpoint**. Isinya ada di kode aplikasi, sesuai PRD.

## API admin berita dan galeri

| Method | Path | Body utama |
|---|---|---|
| POST | `/news` | `title`, `publishedOn`, `category`, `author`, `summary`, `body`, `coverMediaId` |
| PATCH | `/news/:id` | sama, kecuali slug |
| DELETE | `/news/:id` | – |
| POST | `/albums` | `name`, `eventDate`, `description` |
| PATCH | `/albums/:id` | `name`, `eventDate`, `description` |
| DELETE | `/albums/:id` | – |
| POST | `/albums/:id/photos` | `mediaId`, `alt`, `order` |
| PATCH | `/albums/:id/cover` | `mediaId` |
| DELETE | `/albums/:id/photos/:photoId` | – |

Aturan yang ditegakkan:

- Simpan berarti terbit. Tidak ada draft, approval, atau sembunyikan.
- Slug dibuat sekali dari judul saat pembuatan, dan **tidak berubah** saat judul
  diedit, supaya tautan lama tidak mati. Bentrok slug ditangani dengan akhiran
  `-2`, `-3`, dan seterusnya.
- `publishedOn` dan `eventDate` wajib berformat `YYYY-MM-DD` dan harus tanggal
  yang benar-benar ada.
- Menghapus berita tidak menghapus file media, karena media bisa dipakai konten
  lain.
- Foto unggulan harus salah satu foto album itu. Trigger database menolak yang
  lain, dan API menerjemahkannya menjadi `422 cover_not_in_album`.
- Foto unggulan tidak bisa dihapus sebelum unggulan dipindah ke foto lain
  (`409 photo_is_cover`).

## API media

Prefix `/api/admin/media`. Semua memerlukan operator.

| Method | Path | Keterangan |
|---|---|---|
| POST | `/upload` | `multipart/form-data`: `file`, `folder`, `alt` |
| GET | `/list` | 200 media terbaru |
| DELETE | `/:id` | Hapus media, ditolak bila masih dipakai |
| PATCH | `/:id` | Ubah `alt` |
| GET | `/limits` | Batas yang benar-benar ditegakkan server |

Aturan unggah:

- Maksimal 5 MB per file. Diperiksa di aplikasi **dan** di bucket Storage.
- Hanya JPG/PNG/WebP, ditentukan dari **magic bytes** isi file, bukan dari nama
  file atau header MIME yang dikirim browser. Keduanya mudah dipalsukan.
- Nama file tidak dipakai mentah. Path dibuat sendiri:
  `<folder>/<YYYY-MM-DD>-<nama-aman>-<8 karakter acak>.<ext>`.
- `folder` harus salah satu: `branding`, `profil`, `perangkat`, `berita`,
  `galeri`, `fasilitas`.
- Kalau pencatatan metadata gagal setelah file terunggah, file di Storage
  dihapus lagi supaya tidak ada file yatim.
- Media yang masih dipakai konten lain tidak bisa dihapus. Delapan relasi
  diperiksa: sampul berita, sampul album, foto berita, foto galeri, foto
  perangkat, foto BPD, foto fasilitas, dan foto Kepala Desa.

## Keamanan berlapis

Tiga lapisan menjaga penulisan, dan semuanya harus lulus:

1. **Penjaga di route** (`requireOperator`) menentukan status HTTP yang benar:
   503 bila belum dikonfigurasi, 401 bila belum login, 403 bila bukan operator.
2. **RLS di database** menolak tulisan dari akun yang tidak terdaftar, walaupun
   lapisan pertama punya celah.
3. **GRANT tabel** memberi `anon` hanya SELECT, sehingga pengunjung tidak pernah
   sampai ke evaluasi policy untuk menulis.

Service role key **tidak dipakai** untuk melayani request pengguna. Fungsi
`createSupabaseAdminClient()` ada di kode tetapi tidak dipanggil di mana pun;
memakainya akan melewati RLS sepenuhnya dan membuat lapisan kedua hilang.
