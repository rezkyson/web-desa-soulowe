# Uji login dan alur admin

Skrip ini menguji login sungguhan, membuat data uji, lalu **menghapusnya
sendiri**. Aman dijalankan berulang.

Kredensial tidak disimpan di file mana pun. Anda memasukkannya sebagai variabel
environment di terminal, dan nilainya hilang saat terminal ditutup.

## Prasyarat

Preview harus berjalan. Buka terminal **baru** (jangan tutup yang ini):

```powershell
cd "E:\PALU STUDIO CODE\web desa soulowe"
bun run preview -- --port 4173
```

Tunggu sampai muncul `http://127.0.0.1:4173/`.

## Menjalankan uji

Di terminal **kedua**:

```powershell
cd "E:\PALU STUDIO CODE\web desa soulowe"
$env:PREVIEW_URL='http://127.0.0.1:4173'
$env:OPERATOR_EMAIL='email-operator-anda'
$env:OPERATOR_PASSWORD='password-operator-anda'
bun scripts/admin-flow.mjs
```

Ganti dua nilai terakhir dengan kredensial akun operator Anda.

## Hasil yang diharapkan

```
PASS: 11 admin flow checks.
  - login as operator@...
  - session persists across requests via cookie
  - dashboard: 3 berita, 2 album, tahun 2026
  - news created with slug "uji-alur-admin-..."
  - new news is immediately visible publicly (no draft state)
  - editing the title keeps the existing slug
  - empty title rejected with 422 and a field message
  - invalid date format rejected
  - album created with slug "album-uji-..."
  - cover photo from a different album is rejected with a clear message
  - official created
  - logout invalidates the session
  - test data removed
```

Angka berita dan album bisa berbeda, tergantung isi database Anda.

## Kalau gagal

| Pesan | Artinya |
|---|---|
| `login failed: 401` | Email atau password salah |
| `login failed: 403` | Akun belum terdaftar di `admin_users` |
| `login failed: 503` | `.env` belum terbaca, restart preview |
| `cover ... should be 422, got 200` | Trigger unggulan album tidak aktif, jalankan ulang migration |
| `newly created news is not visible` | Berita tidak langsung terbit, ada masalah policy |

Kirim pesan errornya ke saya kalau ada yang gagal. Data uji sudah dibersihkan
otomatis, termasuk saat skrip gagal di tengah jalan.

## Membersihkan sisa data uji secara manual

Kalau skrip terhenti paksa (misalnya terminal ditutup), mungkin ada data uji
tertinggal. Hapus lewat SQL Editor:

```sql
delete from public.news where title like 'Uji alur admin %' or title like 'Judul diubah %';
delete from public.gallery_albums where name like 'Album uji %';
delete from public.village_officials where name like 'Uji %' and role = 'Staf Uji';
```

Perintah ini hanya menyentuh data uji dengan pola nama yang jelas, bukan konten
asli.
