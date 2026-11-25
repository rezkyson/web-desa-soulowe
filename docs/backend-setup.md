# Fase 2, Backend: cara menjalankan migration

Dokumen ini menjelaskan urutan menjalankan `supabase/migrations/` dan
`supabase/seed.sql`. Ditulis untuk dijalankan oleh pemilik project, bukan
otomatis oleh agen, karena butuh kredensial yang tidak boleh dibagikan.

## Yang dibutuhkan

- Project Supabase (gratis cukup untuk MVP).
- Akses ke SQL Editor project tersebut, atau Supabase CLI bila lebih nyaman.

Tidak ada nilai secret yang perlu dikirim ke siapa pun.

## Urutan menjalankan

Jalankan **berurutan**. Migration kedua bergantung pada tabel dari yang pertama.

### 1. `20261125120000_schema.sql`

Membuat seluruh tabel, constraint, index, trigger, dan helper `touch_updated_at`.

### 2. `20261125120100_rls.sql`

Mengaktifkan RLS di semua tabel konten, membuat policy baca publik dan tulis
operator, membuat tabel `admin_users`, serta bucket Storage `media`.

### 3. `seed.sql`

Mengisi data awal dari dokumen profil desa. Aman dijalankan berulang: semua
insert memakai `on conflict do nothing` sehingga data operator tidak tertimpa.

## Lewat SQL Editor

1. Buka project, masuk ke **SQL Editor**.
2. Tempel isi `20261125120000_schema.sql`, klik **Run**. Pastikan tidak ada error.
3. Ulangi untuk `20261125120100_rls.sql`.
4. Ulangi untuk `seed.sql`.
5. Periksa: **Table Editor** harus menampilkan 14 tabel, dan `storage.buckets`
   berisi bucket `media`.

## Lewat Supabase CLI

```sh
supabase link --project-ref <project-ref>
supabase db push
```

`seed.sql` tidak dijalankan otomatis oleh `db push`. Jalankan manual:

```sh
psql "$DATABASE_URL" -f supabase/seed.sql
```

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

Jalankan sebagai anon (tanpa login) di SQL Editor dengan role `anon`:

```sql
set role anon;
select count(*) from public.news;            -- boleh berhasil
insert into public.news (title, slug, published_on) values ('x','x','2026-01-01');
-- harus gagal: new row violates row-level security policy
reset role;
```

Kalau insert sebagai anon berhasil, RLS belum aktif dan harus diperbaiki
sebelum lanjut ke Fase 3.
