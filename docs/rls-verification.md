# Hasil pemeriksaan RLS (BE-26)

Dijalankan 27 November 2026 di project Supabase produksi, lewat SQL Editor.

## Kenapa diperiksa di database, bukan lewat API

Endpoint aplikasi sudah punya penjaga sendiri (`requireOperator`). Kalau hanya
endpoint yang diuji, RLS tidak pernah benar-benar dievaluasi, sehingga
kebocoran di lapisan database bisa lolos tanpa ketahuan. Karena itu akses diuji
langsung ke database dengan peran yang berbeda.

Service role key tidak dipakai untuk pengujian ini, karena service role melewati
RLS sepenuhnya dan akan membuat hasilnya tidak bermakna.

## Lapis 1: akses anonim lewat REST Supabase

Skrip: `scripts/rls-anon-check.mjs`, dijalankan dengan kunci publishable yang
sama seperti yang dipegang peramban.

| Pemeriksaan | Hasil |
|---|---|
| Baca berita | 200, berhasil |
| Baca statistik | 200, berhasil |
| Tulis berita | 401, ditolak |
| Ubah berita | 401, ditolak |
| Hapus berita | 401, ditolak |
| Baca `admin_users` | 401, ditolak |
| Baca daftar media | 200, berhasil |
| Unggah media | 400, ditolak |
| `is_operator()` | 200, `false` |

**9 dari 9 lulus.**

## Lapis 2: tiga peran di database

Skrip: `supabase/rls-roles.sql`, satu kali Run. Peran ditukar dengan `SET ROLE`
lalu dikembalikan, dan setiap operasi tulis selalu dibatalkan dengan `RAISE`.

| No | Pemeriksaan | Hasil |
|---|---|---|
| 1 | anon baca berita | ok: 3 baris terlihat |
| 2 | anon tolak tulis berita | ok: permission denied for table news |
| 3 | anon tidak bisa baca `admin_users` | ok: permission denied for table admin_users |
| 4 | anon `is_operator` | ok: false |
| 5 | non-operator baca berita | ok: 3 baris terlihat |
| 6 | non-operator tolak tulis berita | **ok: new row violates row-level security policy for table "news"** |
| 7 | non-operator tolak ubah berita | ok: 0 baris terpengaruh |
| 8 | non-operator tolak hapus berita | ok: 0 baris terpengaruh |
| 9 | non-operator `is_operator` | ok: false |
| 10 | non-operator tolak tulis media | ok: new row violates row-level security policy for table "objects" |
| 11 | operator `is_operator` | ok: true |
| 12 | operator bisa menulis berita | ok: insert diterima, lalu dibatalkan |

**12 dari 12 lulus, 0 perlu diperiksa.**

## Baris yang paling penting

Baris 6 dan 10 adalah inti pembuktiannya. Keduanya menghasilkan
`new row violates row-level security policy`, bukan `permission denied`.

Bedanya menentukan:

- `permission denied` berarti yang menolak adalah **GRANT tabel**, sehingga RLS
  belum sempat menilai apa pun. Itu yang terjadi pada `anon` (baris 2 dan 3),
  dan memang wajar karena `anon` hanya diberi izin baca.
- `new row violates row-level security policy` berarti role **punya** izin tulis
  tabel, tetapi **policy RLS** yang menolak. Inilah yang membuktikan akun login
  yang tidak terdaftar di `admin_users` tidak bisa menulis apa pun, walaupun
  lapisan penjaga di aplikasi punya celah.

Tanpa baris 6 dan 10, kita hanya membuktikan `anon` tidak bisa menulis. Itu
tidak cukup, karena ancaman yang sebenarnya adalah akun yang berhasil login
tetapi bukan operator.

## Kebersihan data setelah pengujian

Diperiksa ulang setelah skrip dijalankan:

| Tabel | Jumlah | Keterangan |
|---|---|---|
| `news` | 3 | hanya seed, tidak ada slug `uji-*` |
| `statistics` | 29 | sesuai seed |
| `gallery_albums` | 2 | sesuai seed |
| `media_assets` | 5 | sesuai seed |
| Storage `media` | kosong | seed hanya metadata, file tidak diunggah |

Tidak ada baris atau objek uji yang tertinggal.

## Cara menjalankan ulang

```sql
-- tempel seluruh isi supabase/rls-roles.sql di SQL Editor, lalu Run
```

Saat muncul dialog "Potential issues detected", pilih **Run without RLS**.
Dua peringatannya tidak berlaku di sini:

- "destructive operations" berasal dari `drop table if exists rls_results`, dan
  yang dihapus hanya tabel sementara buatan skrip itu sendiri.
- "creates a table without enabling RLS" tidak berlaku karena `rls_results`
  adalah **temp table**: hanya hidup selama sesi, tidak masuk schema `public`,
  dan tidak bisa diakses klien.

Untuk akses anonim:

```sh
bun run test:rls
```
