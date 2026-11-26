# Membuat akun operator

Satu akun, dibuat manual lewat dashboard Supabase. Tidak ada registrasi publik,
sesuai PRD.

## Sebelum mulai: matikan registrasi publik

1. Buka project Supabase
2. Menu kiri: **Authentication**
3. Tab **Sign In / Providers** (atau **Providers**)
4. Cari **Email**
5. Matikan **Enable sign ups**
6. **Save**

Kalau langkah ini terlewat, siapa pun yang tahu URL project bisa mendaftar
sendiri. Meski tidak otomatis jadi operator, ini tetap celah yang tidak perlu.

## Langkah 1: buat user

1. **Authentication** > tab **Users**
2. Klik tombol **Add user** (di kanan atas)
3. Isi:
   - **Email**: email operator, misalnya `operator@desasoulowe.id`
   - **Password**: minimal 8 karakter, gunakan yang kuat
   - **Auto Confirm User**: **aktifkan** (centang). Tanpa ini, akun tidak bisa
     login karena email konfirmasi tidak terkirim.
4. **Create user**

Catat email dan password-nya. Password tidak bisa dilihat lagi setelah ini.

## Langkah 2: daftarkan sebagai operator

Akun yang sudah ada **belum** bisa mengelola konten. Tanpa langkah ini, login
akan berhasil tetapi semua operasi tulis ditolak dengan pesan "Akun ini tidak
memiliki akses operator". Itu perilaku yang benar.

Buka **SQL Editor**, lalu jalankan (ganti emailnya):

```sql
insert into public.admin_users (user_id, email)
select id, email from auth.users where email = 'operator@desasoulowe.id'
on conflict (user_id) do nothing;
```

Untuk memastikan berhasil, jalankan:

```sql
select u.email, a.user_id is not null as terdaftar_operator
from auth.users u
left join public.admin_users a on a.user_id = u.id
order by u.created_at;
```

Kolom `terdaftar_operator` harus `true` untuk akun operator Anda.

## Langkah 3: uji login

Setelah `.env` terisi dan aplikasi berjalan:

```powershell
bun run preview -- --port 4173
```

Lalu uji endpoint login:

```powershell
$body = @{ email = 'operator@desasoulowe.id'; password = 'PASSWORD_ANDA' } | ConvertTo-Json
Invoke-WebRequest -Uri 'http://127.0.0.1:4173/api/admin/auth/login' `
  -Method Post -ContentType 'application/json' -Body $body -UseBasicParsing
```

Hasil yang benar: status 200 dan body berisi `{"data":{"id":"...","email":"..."},"error":null}`.

Kalau muncul 403 `not_operator`, langkah 2 belum berhasil.
Kalau muncul 401 `invalid_credentials`, email atau password salah.
Kalau muncul 503, `.env` belum terbaca (restart server setelah mengubah `.env`).

## Kalau lupa password

Dashboard Supabase tidak menyimpan password dalam bentuk yang bisa dibaca.
Reset lewat **Authentication** > **Users** > klik user > **Reset password**,
atau hapus user lalu buat ulang dan daftarkan ulang di `admin_users`.

## Mengganti password lewat aplikasi

Setelah login, endpoint `POST /api/admin/auth/password` bisa dipakai. Wajib
menyertakan password lama, supaya sesi yang terbuka di perangkat lain tidak bisa
mengganti password tanpa mengetahuinya.

```powershell
$body = @{ currentPassword = 'LAMA'; newPassword = 'BARU_MIN_8' } | ConvertTo-Json
Invoke-WebRequest -Uri 'http://127.0.0.1:4173/api/admin/auth/password' `
  -Method Post -ContentType 'application/json' -Body $body -UseBasicParsing
```

## Jangan lakukan

- Jangan membuat lebih dari satu akun operator pada MVP.
- Jangan mengaktifkan kembali registrasi publik.
- Jangan menaruh password di file yang ikut ter-commit.
- Jangan mengirim password atau service role key ke siapa pun, termasuk ke agen.
