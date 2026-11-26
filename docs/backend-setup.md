# Fase 2, Backend: cara menjalankan migration

Dokumen ini menjelaskan urutan menjalankan `supabase/migrations/` dan
`supabase/seed.sql`. Ditulis untuk dijalankan oleh pemilik project, bukan
otomatis oleh agen, karena butuh kredensial yang tidak boleh dibagikan.

## Yang dibutuhkan

- Project Supabase (gratis cukup untuk MVP).
- Akses ke SQL Editor project tersebut, atau Supabase CLI bila lebih nyaman.

Tidak ada nilai secret yang perlu dikirim ke siapa pun.

## Urutan menjalankan

Ada **tiga file**. Jalankan berurutan, jangan dibalik. Migration kedua
membutuhkan tabel dari yang pertama, dan seed membutuhkan keduanya.

| Urutan | File | Isi |
|---|---|---|
| 1 | `supabase/migrations/20261125120000_schema.sql` | 14 tabel, constraint, index, trigger |
| 2 | `supabase/migrations/20261125120100_rls.sql` | RLS, policy, `admin_users`, bucket Storage |
| 3 | `supabase/migrations/20261126120000_grants.sql` | Izin tabel untuk anon dan authenticated |
| 4 | `supabase/seed.sql` | Data awal dari dokumen profil desa |

Nama file memakai awalan tanggal supaya urutannya jelas dan cocok dengan
Supabase CLI (`supabase db push` menjalankan migration sesuai nama).

## Lewat SQL Editor

Untuk setiap file:

1. Buka project, masuk ke **SQL Editor**.
2. Klik **New query**.
3. Buka file di editor teks, **salin seluruh isinya**, tempel ke SQL Editor.
4. Klik **Run** (atau Ctrl+Enter).
5. Pastikan muncul "Success. No rows returned" dan tidak ada error merah.

Ulangi untuk file kedua, lalu ketiga. Jangan menempel ketiga file sekaligus
dalam satu query: kalau satu bagian gagal, Anda sulit tahu bagian mana.

### Kalau ada error di tengah jalan

- File 1 (`schema`) **tidak** aman diulang. Kalau gagal di tengah, sebagian
  tabel sudah terbuat. Hapus dulu lewat SQL Editor:

  ```sql
  drop schema public cascade;
  create schema public;
  grant usage on schema public to anon, authenticated, service_role;
  grant all on schema public to postgres;
  ```

  Lalu jalankan ulang file 1 dari awal. Jangan lakukan ini kalau sudah ada data
  yang ingin dipertahankan.

- File 2 (`rls`) **aman diulang**: policy dihapus lalu dibuat ulang.
- File 3 (`seed`) **aman diulang**: semua insert memakai `on conflict do nothing`.

## Lewat Supabase CLI (alternatif)

```sh
supabase link --project-ref <project-ref>
supabase db push
```

`db push` hanya menjalankan folder `migrations/`. `seed.sql` dijalankan manual:

```sh
psql "$DATABASE_URL" -f supabase/seed.sql
```

## Setelah ketiga file berhasil

Lanjut ke bagian **Membuat akun operator** di bawah. Tanpa akun terdaftar,
semua operasi tulis akan ditolak RLS, dan itu memang perilaku yang benar.

## Membuat akun operator

Registrasi publik harus **nonaktif** (Authentication, Providers, Email, matikan
"Enable sign ups"). Buat satu akun lewat dashboard: **Authentication, Users,
Add user**.

Setelah akun ada, daftarkan sebagai operator. Tanpa langkah ini semua operasi
tulis akan ditolak RLS, dan itu memang perilaku yang diinginkan.

```sql
insert into public.admin_users (user_id, email)
select id, email from auth.users where email = 'alamat-operator@contoh.id'
on conflict (user_id) do nothing;
```

Verifikasi:

```sql
select public.is_operator();  -- false saat dijalankan sebagai anon, true sebagai operator
```

Panduan langkah demi langkah dengan tangkapan menu dan cara menguji login:
`docs/operator-account.md`.

## Izin tabel (penting)

Migration `20261126120000_grants.sql` wajib dijalankan. RLS hanya menyaring
baris; tanpa `GRANT`, role `anon` ditolak dengan "permission denied for table"
sebelum policy dievaluasi. Supabase tidak memberi grant otomatis untuk tabel
yang dibuat lewat SQL Editor.

Kalau Anda sudah menjalankan tiga migration pertama sebelum file ini ada,
jalankan file keempat ini sekarang:

```sql
-- isi supabase/migrations/20261126120000_grants.sql
```

## Mengunggah file media contoh

Seed hanya mencatat metadata, tidak mengunggah biner. Bucket `media` harus
berisi file dengan path yang sama seperti di seed, misalnya `images/landscape.jpg`.
Tanpa file itu, baris `media_assets` ada tetapi gambarnya tidak akan tampil.

Unggah lewat **Storage, bucket media**, atau:

```sh
supabase storage cp static/images/landscape.jpg ss:///media/images/landscape.jpg
```

## Yang sengaja tidak dilakukan

- Tidak ada total belanja, surplus, atau defisit yang dihitung database.
  Angka mengikuti dokumen apa adanya.
- Tidak ada kolom draft, approval, atau hidden pada berita dan album. Simpan
  berarti terbit, sesuai PRD.
- Tidak ada tabel data individu penduduk. Hanya agregat.
- Tahun statistik dan keuangan dikunci 2026 oleh constraint, sesuai MVP.

## Verifikasi setelah selesai

Jalankan **`supabase/verify.sql`** di SQL Editor. Seluruh isi file, satu kali Run.

File itu mengumpulkan 16 pemeriksaan ke satu tabel sementara, karena SQL Editor
hanya menampilkan hasil statement **terakhir**. Tanpa pengumpulan ini, Anda
hanya akan melihat satu baris dan mengira sisanya gagal.

Yang diperiksa:

| No | Pemeriksaan |
|---|---|
| 1-2 | 14 tabel ada, RLS aktif di semuanya |
| 3-4 | 52 policy konten, `admin_users` tanpa policy |
| 5-6 | Bucket `media` 5 MB, 4 policy Storage |
| 7-11 | Jumlah baris seed: statistik 29, keuangan 11, perangkat 8, berita 3, album 2 |
| 12 | Nilai tidak tersedia tetap `null`, bukan 0 |
| 13 | Foto unggulan tiap album benar milik albumnya |
| 14 | Constraint tahun 2026 menolak tahun lain |
| 15 | Trigger menolak unggulan dari album lain |
| 16 | Status akun operator |

Pemeriksaan 14 dan 15 sengaja mencoba operasi terlarang, lalu **mengembalikan
keadaan semula** apa pun hasilnya, supaya pengujian tidak merusak data.

Semua baris harus `ok`. Baris 16 boleh `BELUM` sampai akun operator dibuat.
Kalau ada yang `GAGAL`, jangan lanjut ke tahap API: kirim hasilnya.

Setelah akun operator ada, uji juga bahwa RLS menolak tulisan anonim:

```sql
set role anon;
select count(*) from public.news;            -- boleh berhasil
insert into public.news (title, slug, published_on) values ('x','x','2026-01-01');
-- harus gagal: new row violates row-level security policy
reset role;
```

Kalau insert sebagai anon berhasil, RLS belum aktif dan harus diperbaiki
sebelum lanjut ke Fase 3.
