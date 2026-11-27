# TASK — Pengembangan Website Desa Soulowe

**Acuan:** [`prd.md`](./prd.md), versi 1.0 — Final untuk MVP  
**Tanggal penyusunan:** 21 November 2026  
**Status proyek:** Fase 1 diterima pengguna 25 November 2026; Fase 2 (Backend) diizinkan dan sedang berjalan  
**Fase aktif:** Fase 2 — Backend Development (terblokir menunggu akses Supabase development)

## 1. Tujuan dan Urutan Pengerjaan

Dokumen ini memecah PRD menjadi tugas terarah dengan batas pekerjaan, hasil yang harus diserahkan, dan persetujuan pada setiap perpindahan fase.

Urutan wajib:

```text
Fase 1: Frontend Development
  → Review pengguna → Persetujuan
Fase 2: Backend Development
  → Review pengguna → Persetujuan
Fase 3: Integration — menghubungkan frontend dan backend
  → Review pengguna → Persetujuan
Fase 4: Testing
  → Review pengguna → Persetujuan
Fase 5: Deploy
  → Verifikasi produksi → Persetujuan penyelesaian
```

## 2. Aturan Pelaksanaan dan Kontrol Scope

1. **Pembuatan TASK.md bukan izin memulai implementasi.** Fase 1 baru dikerjakan setelah pengguna menyetujuinya.
2. **Dilarang melanjutkan ke fase berikutnya tanpa konfirmasi eksplisit pengguna**, meskipun seluruh checklist fase sebelumnya selesai.
3. Setelah satu fase selesai, berhenti dan sampaikan hasil, bukti pemeriksaan, kendala, serta permintaan persetujuan melanjutkan.
4. Persetujuan bersifat spesifik per fase. Persetujuan Fase 1 tidak otomatis mengizinkan Fase 2–5.
5. Jika pengguna meminta revisi, selesaikan revisi pada fase tersebut dan minta persetujuan kembali sebelum berpindah fase.
6. Jika ada blocker, catat dan minta keputusan atau kebutuhan akses; jangan menganggap pekerjaan yang terblokir sudah selesai.
7. Centang tugas hanya setelah benar-benar dikerjakan dan diverifikasi. Catat bukti yang relevan pada laporan fase.
8. `prd.md` menjadi sumber scope produk; `TASK.md` mengatur urutan eksekusi. Perubahan requirement harus mendapat persetujuan, lalu diperbarui pada dokumen terkait.
9. Jangan menambahkan fitur opsional, dependensi besar, atau layanan baru yang tidak diperlukan MVP tanpa persetujuan. Activity log opsional pada PRD tidak menjadi pekerjaan wajib MVP.
10. Pemeriksaan lokal seperti type-check, build, dan smoke check tetap dilakukan pada setiap fase. **Fase 4 adalah pengujian menyeluruh**, bukan alasan menunda pemeriksaan dasar atau keamanan.
11. Gunakan data development untuk eksperimen. Jangan menimpa data produksi, menghapus project, atau membagikan kredensial dalam repository/laporan.
12. Jika perbaikan membutuhkan perubahan pada hasil fase sebelumnya, batasi pada kebutuhan MVP, catat dampaknya, dan lakukan pemeriksaan regresi. Perubahan desain/arsitektur besar harus dikonfirmasi terlebih dahulu.

### Scope yang dikunci

- Satu aplikasi SvelteKit + TypeScript, Bun, ElysiaJS, Supabase, dan satu project Vercel.
- Bahasa Indonesia; satu akun admin/operator; tidak ada registrasi publik.
- Statistik dan keuangan hanya **2026**, tanpa selector atau arsip multi-tahun.
- Konten tetap disimpan di kode/file konten; tidak tersedia sebagai CRUD admin.
- Berita dan album langsung terbit saat disimpan; berita hanya edit dan hapus, tanpa draft/approval/sembunyikan.
- Galeri berbasis album dengan banyak foto dan foto unggulan.
- WhatsApp sebagai satu-satunya kanal layanan; nomor awal dummy yang dapat diedit.
- Upload JPG/JPEG/PNG/WebP, maksimal 5 MB per file.
- Aksi destruktif memakai modal konfirmasi.
- Peta kantor memakai Leaflet + OpenStreetMap dan tautan maps eksternal; tanpa batas wilayah.
- Tidak ada pengaduan, surat online, login warga, data individu, data etnis, marketplace, atau program per bidang.
- Angka keuangan mengikuti dokumen, tanpa penjumlahan ulang total belanja atau surplus/defisit otomatis.
- Luas wilayah mengikuti PRD (`±5.000 km²`); jangan mengoreksi data sumber sendiri.

## 3. Ringkasan Status dan Gerbang Persetujuan

| Fase | Status pekerjaan | Persetujuan mulai | Persetujuan hasil |
|---|---|---|---|
| 1 — Frontend | Selesai dan diterima pengguna; termasuk revisi review 22 sampai 25 November 2026; laporan `docs/phase-1-report.md` | Disetujui pengguna, 21 November 2026 | Diterima 25 November 2026 |
| 2 — Backend | Berjalan; terblokir menunggu akses Supabase development | Diizinkan pengguna, 25 November 2026 | Belum diminta |
| 3 — Integration | Belum dimulai | Menunggu hasil Fase 2 dan izin pengguna | Belum diminta |
| 4 — Testing | Belum dimulai | Menunggu hasil Fase 3 dan izin pengguna | Belum diminta |
| 5 — Deploy | Belum dimulai | Menunggu hasil Fase 4 dan izin pengguna | Belum diminta |

Persetujuan hasil fase dapat sekaligus menjadi izin memulai fase berikutnya **hanya jika pengguna menyatakannya secara eksplisit**. Catat tanggal dan ringkasan konfirmasi pada bagian 10.

---

## 4. Fase 1 — Frontend Development

**Tujuan:** Website publik dan panel admin dapat direview secara visual dan interaktif menggunakan data mock, tanpa ketergantungan backend aktif.  
**Acuan PRD:** Bagian 5–10, 14–16, dan 18.  
**Prasyarat:** Pengguna menyetujui memulai Fase 1.

### 1.1 Fondasi frontend dan persiapan konten

- [x] FE-01 — Siapkan project SvelteKit + TypeScript dengan Bun, script development/check/build, dan struktur route publik/admin yang terpisah.
- [x] FE-02 — Baca dokumen `PROFIL_DESA_SOULOWE_2025-2026.docx` dan petakan konten terhadap PRD; gunakan `logo.png` tanpa mengubah aset sumber.
- [x] FE-03 — Simpan konten tetap dalam modul/file aplikasi; pisahkan dari fixture konten dinamis.
- [x] FE-04 — Siapkan tipe data dan mock untuk seluruh modul dinamis, termasuk variasi data kosong, error, dan loading. Tandai konten dummy secara internal.
- [x] FE-05 — Buat kontrak data awal untuk handoff backend: field, tipe, relasi, kebutuhan baca/tulis, slug, tanggal, nilai kosong, format error, dan batas upload. Ini rancangan kontrak, bukan implementasi API.
- [x] FE-06 — Catat ketidakkonsistenan data sumber tanpa menebak perbaikannya; khususnya tabel sarana pendidikan versus sarana umum. Pertahankan konteks sumber, jangan menggabungkan angka yang bertentangan secara diam-diam.

### 1.2 Desain dan komponen

- [x] FE-07 — Gunakan skill **Impeccable** pada perancangan dan implementasi visual; tetapkan arah modern, clean, resmi, hangat, dan anti-AI-slop. Instruksi utama diterapkan; akses referensi tambahan ditolak lingkungan, dicatat dalam laporan.
- [x] FE-08 — Dokumentasikan keputusan desain/tokens: warna, tipografi, spacing, breakpoint, radius, ikon, dan motion agar halaman konsisten.
- [x] FE-09 — Buat layout publik: header, navigasi desktop/mobile, footer, serta tautan WhatsApp dan lokasi.
- [x] FE-10 — Buat layout admin: navigasi, header, area konten, dan perilaku responsif.
- [x] FE-11 — Buat komponen bersama: tombol, field/form, tabel, statistik/grafik selektif, pesan validasi, notifikasi, preview upload, dan state loading/empty/error.
- [x] FE-12 — Buat modal konfirmasi dengan tombol Batal/Hapus, pengelolaan fokus, navigasi keyboard, serta status proses untuk mencegah klik ganda.
- [x] FE-13 — Terapkan motion singkat dan fungsional, focus state jelas, kontras memadai, alt text, dan dukungan `prefers-reduced-motion`. Audit aksesibilitas menyeluruh tetap Fase 4.

### 1.3 Halaman publik

- [x] FE-14 — Beranda: hero, identitas/ringkasan desa, sambutan Kepala Desa, statistik, berita dan album terbaru, WhatsApp, serta lokasi.
- [x] FE-15 — Profil: identitas, sejarah, asal-usul nama, visi-misi, geografis, luas, iklim, penggunaan lahan, sosial budaya, ekonomi, tipologi, dan orbitasi.
- [x] FE-16 — Pemerintahan: struktur, perangkat desa, pendidikan, foto opsional, BPD, serta informasi dusun yang relevan.
- [x] FE-17 — Data Desa: kependudukan, pendidikan, mata pencaharian, dan sarana-prasarana tahun 2026; hanya agregat dan tanpa detail personal.
- [x] FE-18 — Keuangan: pendapatan dan belanja per bidang tahun 2026, format Rupiah, nilai `-` yang tidak otomatis dianggap nol, dan catatan sumber; tanpa total belanja/surplus/defisit turunan.
- [x] FE-19 — Daftar/detail berita: judul, slug, ringkasan, isi, kategori, tanggal, penulis opsional, foto utama/tambahan, dan penanganan berita tidak ditemukan.
- [x] FE-20 — Daftar/detail album: nama, tanggal kegiatan, deskripsi, foto unggulan, banyak foto, dan penanganan album tidak ditemukan.
- [x] FE-21 — Layanan WhatsApp: nomor, tombol `wa.me`, dan pesan pembuka; tandai nomor dummy pada mode development agar tidak dianggap kontak resmi.
- [x] FE-22 — Kontak/lokasi: alamat dokumen, Leaflet yang aman untuk SSR, atribusi OpenStreetMap, dan tombol membuka maps. Peta aktif pada titik kantor dari tautan koreksi pengguna; tile nyata, pin/popup, zoom, fallback koneksi, dan tampilan mobile diperiksa (`docs/map-results.json`).
- [x] FE-23 — Siapkan title/meta description, Open Graph, favicon dari logo, halaman 404, dan kerangka sitemap/robots. URL domain final dan data SEO dinamis diselesaikan pada fase berikutnya.

### 1.4 Halaman admin — UI dan simulasi lokal

- [x] FE-24 — Buat UI login, logout, pengaturan/ganti password, serta state sesi sebagai simulasi development; jangan menyebutnya autentikasi aman sebelum backend terhubung.
- [x] FE-25 — Dashboard: jumlah berita/album, tahun 2026, dan shortcut sesuai PRD.
- [x] FE-26 — Form nama/foto/sambutan Kepala Desa.
- [x] FE-27 — Daftar dan form perangkat desa/BPD: tambah, edit, urutan tampil, foto, serta hapus dengan modal.
- [x] FE-28 — Form statistik 2026: kependudukan, pendidikan, dan mata pencaharian, tanpa selector tahun.
- [x] FE-29 — Daftar dan form sarana-prasarana: kategori, jumlah/nilai beserta satuan, kondisi, keterangan, foto, serta hapus dengan modal.
- [x] FE-30 — Form keuangan 2026 dan keterangan sumber, termasuk konfirmasi penghapusan item tanpa kalkulasi otomatis.
- [x] FE-31 — Daftar/form berita: tambah langsung terbit, edit, hapus, foto utama, dan foto tambahan; tanpa draft atau workflow publikasi.
- [x] FE-32 — Daftar/form album: tambah/edit/hapus, multi-foto, pemilihan foto unggulan, serta konfirmasi penghapusan foto.
- [x] FE-33 — Form WhatsApp dan pesan pembuka otomatis.
- [x] FE-34 — UI media: daftar/pemilihan/penggantian logo, hero, dan foto konten; preview, validasi format/ukuran client, serta konfirmasi jika media lama akan dihapus.
- [x] FE-35 — Simulasikan submit berhasil/gagal, validasi, status proses, dan pembatalan aksi dengan mock; tandai bahwa perubahan belum tersimpan ke server.
- [x] FE-36 — Pastikan konten tetap tidak memiliki menu atau form edit admin.

### 1.5 Pemeriksaan dan hasil fase

- [x] FE-37 — Periksa hasil render publik dan admin pada ukuran mobile, tablet, dan desktop; perbaiki overflow, navigasi, keterbacaan, serta modal/form. Bukti: `docs/screenshots/`.
- [x] FE-38 — Jalankan type-check dan build; periksa tidak ada error runtime utama atau link internal rusak pada alur mock. Check 0 error/0 warning; build dan 36 smoke check production preview lulus.
- [x] FE-39 — Serahkan preview lokal, ringkasan halaman, keputusan desain, rancangan kontrak data, daftar dummy, dan kendala kepada pengguna. Laporan: `docs/phase-1-report.md`.

### 1.6 Revisi hasil review pengguna

Revisi berikut diminta pengguna setelah FE-39 dan dikerjakan masih di dalam Fase 1. Fase tidak berpindah.

- [x] FE-40 — Kartu hero: foto tunggal diganti slideshow foto dari album galeri terbaru, urutan acak per kunjungan, minimal empat frame unik tanpa duplikat. Bukti: `src/lib/components/HeroSlides.svelte`.
- [x] FE-41 — Slideshow hero diubah menjadi autoplay tanpa tombol play/pause atas permintaan pengguna. Penghentian implisit dipertahankan: tab tidak aktif, kartu keluar layar, `prefers-reduced-motion`, dan tahan saat kursor/fokus di kartu. Indikator progres mengikuti foto aktif. Bukti: `docs/hero-slides-results.json`, 12 pemeriksaan.
- [x] FE-42 — Perbaiki navigasi mobile: tautan putih di atas panel terang pada beranda mode overlay, dan panel tembus pandang selama animasi buka. Tambah `Escape`, pengembalian fokus, `aria-controls`, dan panel bergulir di layar pendek. Bukti: `scripts/mobile-menu.mjs`, 13 pemeriksaan, `docs/mobile-menu-results.json`.
- [x] FE-43 — Perbaiki grid foto halaman detail album: atribut `height` pada `img` menang atas `aspect-ratio` sehingga setiap foto dipaksa 700 px tinggi dalam kolom 169 px. Grid kini 4:3 seragam, 2 kolom di ponsel, 3 kolom di layar lebar. Bukti: `scripts/gallery-grid.mjs`, 4 pemeriksaan, `docs/gallery-grid-results.json`.
- [x] FE-44 — Repositori disiapkan untuk publikasi: `.gitattributes` untuk line ending, `docs/screenshots/` dan dokumen kerja internal dikecualikan, gambar referensi klien dipindah keluar dari `public/`. Repo publik: `github.com/rezkyson/web-desa-soulowe`.
- [x] FE-45 — Target sentuh diperbesar ke minimal 44 px pada perangkat sentuh (`pointer: coarse`) untuk dot slideshow, tombol ikon, tautan teks, breadcrumb, daftar isi, tautan footer, filter tab, kontrol zoom, dan tombol tutup popup peta. Ukuran font dan tampilan desktop tidak berubah. Bukti: `scripts/touch-targets.mjs`, 5 pemeriksaan, `docs/touch-target-results.json`.

**Catatan revisi:** Seluruh revisi di atas adalah penyempurnaan tampilan dan perbaikan bug pada frontend yang sudah ada. Tidak ada penambahan modul, perubahan scope, atau klaim fungsi backend. Deploy Vercel sengaja ditunda atas keputusan pengguna sampai perbaikan frontend selesai.

**Batas fase:** Tidak membuat database aktif, autentikasi Supabase nyata, endpoint CRUD backend, upload Storage nyata, atau deployment. Tidak memerlukan kredensial Supabase untuk menyelesaikan frontend.

**Kriteria selesai:** Seluruh halaman publik/admin dapat direview dengan mock; alur UI utama berjalan; tampilan responsif dan state penting tersedia; hasil check/build serta pemeriksaan visual dicatat. Penyimpanan, login, dan upload belum diklaim berfungsi nyata.

**Verifikasi terakhir (25 November 2026):** `bun run check` 0 error dan 0 warning; production build lulus; smoke 36, motion 7, borders 9, map 4, hero-slides 12, mobile-menu 13, gallery-grid 4, touch-targets 5, click-through 30 kontrol dengan 0 error konsol.

### Gerbang Fase 1 → Fase 2

- [x] G1-01 — Pengguna meninjau frontend dan revisi yang diminta sudah diselesaikan.
- [x] G1-02 — Pengguna menerima hasil Fase 1.
- [x] G1-03 — Pengguna secara eksplisit mengizinkan **Fase 2 — Backend Development**.

**STOP: Jangan mulai backend sebelum G1-03 disetujui.**

---

## 5. Fase 2 — Backend Development

**Tujuan:** Database, Auth, Storage, dan API siap digunakan serta dapat diverifikasi terpisah dari UI.  
**Acuan PRD:** Bagian 9–14 dan 19–20.  
**Prasyarat:** Gerbang Fase 1 disetujui; akses/config Supabase development tersedia atau disiapkan dengan izin pengguna.

### 2.1 Database dan data awal

- [x] BE-01 — Finalisasi kontrak API/data berdasarkan frontend yang disetujui; catat perbedaan dari rancangan awal sebelum mengubah kontrak.
- [ ] BE-02 — Siapkan project/lingkungan Supabase development dan `.env.example` tanpa secret; pisahkan konfigurasi server dan public.
- [x] BE-03 — Buat migration untuk `site_settings`, `principal_profile`, `village_officials`, `bpd_members`, `statistics`, `facilities`, `financial_data`, `news`, `news_images`, `gallery_albums`, `gallery_images`, `service_contacts`, dan `media_assets`.
- [x] BE-04 — Terapkan foreign key, slug unik, urutan tampil, timestamp relevan, validasi nilai, dan kolom tahun statistik/keuangan yang dibatasi 2026 pada MVP.
- [x] BE-05 — Bedakan nilai tidak tersedia (`null`/penanda sumber) dari nol; dukung satuan jiwa, KK, RTM, orang, unit, dan km termasuk desimal tanpa mengubah makna data.
- [x] BE-06 — Buat seed yang dapat dijalankan ulang dengan aman untuk data PRD; pisahkan data contoh berita/album/media dari data sumber dan jangan menimpa data pengguna.
- [x] BE-07 — Verifikasi angka seed terhadap PRD/dokumen, termasuk statistik, perangkat, BPD, fasilitas, dan keuangan; jangan membuat total turunan atau koreksi sumber tanpa persetujuan.

### 2.2 Auth dan otorisasi

- [x] BE-08 — Konfigurasikan Supabase Auth untuk satu akun operator yang dibuat secara terkontrol; nonaktifkan registrasi publik dan tidak menyediakan manajemen multi-user.
- [x] BE-09 — Implementasikan login email/password, logout, perubahan password yang aman, serta validasi/refresh session melalui Supabase SSR. Jangan menambahkan login username kecuali pemetaan yang diperlukan telah disepakati.
- [x] BE-10 — Tetapkan identitas admin secara eksplisit (misalnya ID akun operator yang diizinkan); setiap endpoint mutasi harus memeriksa admin, bukan sekadar keberadaan sesi.
- [x] BE-11 — Terapkan RLS database dan policy Storage: publik hanya membaca konten publik; tulis hanya akun operator yang diizinkan; informasi akun tidak terbuka ke publik.
- [x] BE-12 — Pastikan service role key hanya di server, tidak dipakai untuk melewati otorisasi request pengguna, dan tidak tampil di error/log/client bundle.

### 2.3 API ElysiaJS

- [x] BE-13 — Pasang Elysia di endpoint SvelteKit dengan Web Request/Response, kompatibel runtime Vercel, tanpa server production `app.listen()`.
- [x] BE-14 — Implementasikan validasi request, respons/error konsisten, status HTTP, sanitasi isi berita, proteksi request mutasi lintas situs yang sesuai, serta penanganan error tanpa detail sensitif.
- [x] BE-15 — Buat operasi baca publik untuk pengaturan/media aktif, Kepala Desa, pemerintahan/BPD, statistik, fasilitas, keuangan, WhatsApp, berita, dan galeri; detail berita/album memakai slug.
- [x] BE-16 — Buat operasi admin untuk update profil Kepala Desa, konfigurasi media aktif, WhatsApp, serta statistik 2026.
- [x] BE-17 — Buat CRUD perangkat desa/BPD, fasilitas, dan item keuangan 2026 sesuai PRD.
- [x] BE-18 — Buat CRUD berita beserta foto tambahan; pembuatan langsung terbit, slug unik, dan tidak ada endpoint draft/approval/sembunyikan.
- [x] BE-19 — Buat CRUD album/foto beserta penetapan foto unggulan; album langsung tampil setelah penyimpanan berhasil.
- [x] BE-20 — Sediakan data ringkasan dashboard: jumlah berita/album dan tahun aktif 2026.

### 2.4 Storage dan pengelolaan media

- [x] BE-21 — Siapkan Storage dan path `branding/`, `profil/`, `perangkat/`, `berita/`, `galeri/`, `fasilitas/` dengan policy yang sesuai.
- [x] BE-22 — Implementasikan upload terotorisasi: batas 5 MB per file, JPG/JPEG/PNG/WebP, pemeriksaan tipe isi file selain ekstensi/MIME deklaratif, dan nama/path aman.
- [x] BE-23 — Simpan metadata/referensi media; siapkan optimasi gambar yang kompatibel deployment tanpa mengubah batas file masuk.
- [x] BE-24 — Atur penggantian/penghapusan media dan relasi: jangan menghapus file yang masih dipakai konten lain; tangani kegagalan parsial upload, album, dan berita agar referensi tidak rusak.

### 2.5 Pemeriksaan dan hasil fase

- [x] BE-25 — Verifikasi API tanpa UI: baca anonim, mutasi admin, penolakan anonim/non-admin, validasi input/upload, detail tidak ditemukan, dan penanganan error.
- [ ] BE-26 — Periksa RLS dan Storage langsung dengan akses anonim, admin, dan identitas non-admin; jangan hanya menguji endpoint yang memakai service role.
- [ ] BE-27 — Jalankan type-check/build; dokumentasikan migration/seed, kontrak endpoint, environment, pembuatan akun, dan hasil pemeriksaan backend.

**Batas fase:** Jangan menghubungkan UI frontend ke API/Auth/Storage nyata. Jangan deploy aplikasi ke Vercel. Pembuatan resource berbayar atau penggunaan data produksi memerlukan izin tersendiri.

**Kriteria selesai:** Migration/seed dapat direproduksi; API dan Storage berfungsi independen; akun tunggal, RLS, otorisasi, validasi, dan sanitasi telah diperiksa; kontrak API dan kebutuhan environment tersedia. Jika akses Supabase belum tersedia, fase tetap terblokir dan tidak diklaim selesai.

### Gerbang Fase 2 → Fase 3

- [ ] G2-01 — Hasil backend dan bukti pemeriksaan disampaikan; blocker kritis diselesaikan.
- [ ] G2-02 — Pengguna menerima hasil Fase 2.
- [ ] G2-03 — Pengguna secara eksplisit mengizinkan **Fase 3 — Integration**.

**STOP: Jangan mulai integrasi sebelum G2-03 disetujui.**

---

## 6. Fase 3 — Integration (Frontend ↔ Backend)

**Tujuan:** Seluruh alur UI menggunakan data, sesi, dan media nyata dari backend development.  
**Acuan PRD:** Seluruh kebutuhan fungsional publik/admin, keamanan, dan SEO.  
**Prasyarat:** Gerbang Fase 2 disetujui; backend development dapat diakses.

### 3.1 Pembacaan data dan autentikasi

- [ ] IN-01 — Hubungkan frontend ke kontrak backend; pisahkan akses server/client dan ganti mock konten dinamis secara bertahap.
- [ ] IN-02 — Hubungkan data publik dan SSR yang diperlukan untuk SEO; konten tetap tetap berasal dari file aplikasi, bukan dibuat CRUD baru.
- [ ] IN-03 — Hubungkan daftar/detail berita dan album berdasarkan slug; tangani data tidak ditemukan, kosong, gagal dimuat, serta URL gambar.
- [ ] IN-04 — Hubungkan login/logout/ganti password, refresh session, dan proteksi route admin; hapus bypass/sesi simulasi development dari alur aplikasi nyata.
- [ ] IN-05 — Hubungkan dashboard ke jumlah berita/album aktual dan shortcut.

### 3.2 Penyimpanan data dan media

- [ ] IN-06 — Hubungkan simpan nama/foto/sambutan Kepala Desa, WhatsApp, dan pengaturan media.
- [ ] IN-07 — Hubungkan CRUD perangkat/BPD, statistik 2026, fasilitas, serta keuangan 2026.
- [ ] IN-08 — Hubungkan tambah/edit/hapus berita beserta gambar utama dan foto tambahan; berita langsung tampil setelah berhasil disimpan.
- [ ] IN-09 — Hubungkan tambah/edit/hapus album, multi-upload, hapus foto, dan pemilihan foto unggulan.
- [ ] IN-10 — Hubungkan upload/pemilihan/penggantian media dan validasi server ke UI; tampilkan progres/status proses dan error yang dapat ditindaklanjuti.
- [ ] IN-11 — Pastikan aksi destruktif hanya mengirim request setelah konfirmasi; batal tidak mengubah data, submit ganda dicegah, dan kegagalan tidak ditampilkan sebagai sukses.
- [ ] IN-12 — Pastikan perubahan tetap tersimpan setelah reload dan terlihat pada halaman publik tanpa cache usang yang tidak terkendali.

### 3.3 Penyempurnaan integrasi

- [ ] IN-13 — Hubungkan WhatsApp ke nomor/pesan tersimpan dengan normalisasi nomor dan encoding pesan; kontak dummy tidak diperlakukan sebagai nomor resmi.
- [ ] IN-14 — Lengkapi peta/maps sesuai status verifikasi koordinat; tetap gunakan fallback alamat jika belum terverifikasi.
- [ ] IN-15 — Lengkapi metadata/Open Graph dinamis, SSR, sitemap berita/album, dan robots; route admin tidak dimasukkan sitemap atau diindeks.
- [ ] IN-16 — Pastikan fixture tetap hanya untuk pengembangan/pengujian, bukan fallback diam-diam ketika backend gagal; tampilkan error/empty state yang jujur.
- [ ] IN-17 — Jalankan type-check/build dan smoke check alur nyata dari login → simpan → lihat publik → edit/hapus → logout.
- [ ] IN-18 — Serahkan demo terintegrasi, daftar modul terhubung, hasil pemeriksaan, dan kendala kepada pengguna.

**Batas fase:** Tidak menambahkan modul baru, mengubah scope, atau deploy. Pemeriksaan alur di sini belum menggantikan pengujian menyeluruh Fase 4.

**Kriteria selesai:** Semua modul dinamis menggunakan backend nyata; perubahan persisten dan muncul di publik; route admin benar-benar terlindungi; upload dan konfirmasi bekerja; tidak ada bypass mock pada alur nyata.

### Gerbang Fase 3 → Fase 4

- [ ] G3-01 — Demo integrasi diterima dan blocker utama diselesaikan.
- [ ] G3-02 — Pengguna menerima hasil Fase 3.
- [ ] G3-03 — Pengguna secara eksplisit mengizinkan **Fase 4 — Testing**.

**STOP: Jangan mulai fase testing menyeluruh sebelum G3-03 disetujui.**

---

## 7. Fase 4 — Testing

**Tujuan:** Membuktikan aplikasi memenuhi acceptance criteria PRD dan layak masuk fase deployment.  
**Acuan PRD:** Bagian 13–21, terutama seluruh checklist pada bagian 17.  
**Prasyarat:** Gerbang Fase 3 disetujui; data/akun pengujian tersedia dan tidak membahayakan data resmi.

### 4.1 Pengujian fungsional dan data

- [ ] QA-01 — Susun test case publik/admin/keamanan yang dipetakan ke `FR-PUB-001`–`010`, `FR-ADM-001`–`012`, dan acceptance criteria PRD; catat hasil aktual serta bukti.
- [ ] QA-02 — Uji seluruh navigasi, daftar/detail, slug tidak ditemukan, halaman 404, tautan WhatsApp/maps, serta kondisi data kosong dan backend gagal.
- [ ] QA-03 — Uji login valid/tidak valid, logout, perubahan password, sesi kedaluwarsa, refresh/reload, dan akses langsung route admin tanpa sesi.
- [ ] QA-04 — Uji seluruh modul admin: tambah/edit/hapus sesuai kewenangan, urutan tampil, validasi, persistensi setelah reload, serta perubahan pada halaman publik.
- [ ] QA-05 — Uji berita langsung terbit, foto utama/tambahan, album multi-foto/foto unggulan, serta kondisi kegagalan parsial penyimpanan.
- [ ] QA-06 — Uji pembatalan/konfirmasi semua aksi destruktif, penghapusan media yang dipakai bersama, dan pencegahan submit ganda.
- [ ] QA-07 — Cocokkan konten tetap, identitas/alamat, statistik, satuan RTM, pendidikan, mata pencaharian, pemerintahan, fasilitas, dan keuangan dengan sumber; dokumentasikan ketidakkonsistenan tanpa koreksi otomatis.
- [ ] QA-08 — Pastikan tidak ada selector tahun, data personal/etnis, batas wilayah, program per bidang, draft berita, atau fitur di luar scope; tidak ada total belanja/surplus/defisit otomatis.

### 4.2 Keamanan dan upload

- [ ] QA-09 — Uji API/RLS/Storage dengan anonim, admin, dan non-admin; modifikasi request langsung tidak boleh melewati otorisasi atau mengedit konten tetap.
- [ ] QA-10 — Uji file valid, ekstensi/MIME palsu, format tidak didukung, file rusak, ukuran tepat batas 5 MB dan di atas batas, serta kegagalan upload.
- [ ] QA-11 — Uji sanitasi isi berita, input berbahaya, slug/path, proteksi mutasi lintas situs, dan kebocoran detail error.
- [ ] QA-12 — Periksa source/bundle/log agar tidak memuat service role key, password, atau sesi; periksa registrasi publik tetap nonaktif dan tidak ada bypass mock.

### 4.3 Kualitas UI dan teknis

- [ ] QA-13 — Uji tampilan publik/admin pada mobile, tablet, desktop; browser Chromium, Firefox, dan Safari/WebKit sejauh alat/perangkat tersedia. Catat keterbatasan, jangan mengklaim pengujian yang belum dijalankan.
- [ ] QA-14 — Uji keyboard, focus/modal, label form, pesan validasi, kontras, alt text, touch target, serta reduced motion; gunakan Impeccable untuk evaluasi/polish visual jika diperlukan.
- [ ] QA-15 — Periksa performa halaman utama/detail, ukuran gambar, lazy loading yang tepat, grafik/peta, error console, dan request gagal; catat hasil pengukuran dan perbaikan.
- [ ] QA-16 — Verifikasi SSR konten publik, title/description, Open Graph, favicon, sitemap, robots, dan pengecualian admin dari pengindeksan.
- [ ] QA-17 — Jalankan seluruh pemeriksaan otomatis yang tersedia, type-check, dan production build; tambahkan tes otomatis pada alur kritis yang relevan untuk regresi.

### 4.4 Perbaikan dan penerimaan

- [ ] QA-18 — Catat bug beserta langkah reproduksi, tingkat dampak, status perbaikan, dan hasil retest. Jangan menandai tes lulus hanya karena kode diperbaiki.
- [ ] QA-19 — Perbaiki seluruh bug kritis/tinggi dan lakukan regresi; temuan kecil yang ditunda harus disampaikan dan disetujui pengguna.
- [ ] QA-20 — Inventarisasi data dummy, koordinat belum terverifikasi, serta kebutuhan nomor WhatsApp/aset resmi sebagai release blocker atau pengecualian yang harus diputuskan pengguna sebelum publikasi.
- [ ] QA-21 — Lakukan UAT bersama pengguna untuk website publik dan operator; serahkan laporan hasil, keterbatasan, serta rekomendasi siap/tidak siap deploy.

**Batas fase:** Tidak deploy/publish aplikasi. Perbaikan dibatasi pada requirement yang telah disepakati, bukan penambahan fitur baru.

**Kriteria selesai:** Acceptance criteria telah diuji dan hasilnya dicatat; tidak ada bug kritis/tinggi terbuka; pemeriksaan keamanan/build lulus; UAT diterima; daftar kebutuhan peluncuran jelas dan tidak disembunyikan.

### Gerbang Fase 4 → Fase 5

- [ ] G4-01 — Laporan testing/UAT dan temuan tersisa ditinjau pengguna.
- [ ] G4-02 — Pengguna menerima hasil Fase 4 beserta pengecualian nonkritis yang terdokumentasi.
- [ ] G4-03 — Pengguna secara eksplisit mengizinkan **Fase 5 — Deploy** dan menyepakati target deployment.

**STOP: Jangan membuat deployment Vercel atau mempublikasikan website sebelum G4-03 disetujui.**

---

## 8. Fase 5 — Deploy

**Tujuan:** Aplikasi yang telah diuji berjalan pada satu project Vercel dengan Supabase yang aman dan konfigurasi produksi terverifikasi.  
**Acuan PRD:** Bagian 12–14, 16–17, dan 19–21.  
**Prasyarat:** Gerbang Fase 4 disetujui; akses deployment dan keputusan peluncuran tersedia.

### 5.1 Persiapan peluncuran

- [ ] DP-01 — Konfirmasi akun/project Vercel dan Supabase, kepemilikan akses, repository/sumber deployment, target environment, serta batas biaya sebelum membuat resource berbayar.
- [ ] DP-02 — Bahas domain dengan pengguna; gunakan subdomain Vercel bila disetujui, dan jangan membeli domain atau mengubah DNS tanpa izin.
- [ ] DP-03 — Finalisasi konten rilis: ganti WhatsApp dummy dengan nomor resmi; tinjau nama/sambutan/foto Kepala Desa, hero, dan media contoh. Jangan tampilkan foto stok sebagai dokumentasi desa; catat persetujuan untuk dummy nonkritis yang masih dipakai.
- [ ] DP-04 — Verifikasi koordinat kantor dengan pengguna/sumber yang dapat dipercaya. Jika belum pasti, rilis hanya memakai fallback alamat + pencarian maps yang disetujui, bukan pin kantor yang belum terverifikasi.
- [ ] DP-05 — Siapkan adapter/config Vercel yang sesuai, environment production, URL dasar SEO, redirect Auth, cookie/session aman, dan pembatasan origin yang relevan.
- [ ] DP-06 — Siapkan database/Auth/Storage target: jalankan migration dan seed secara terkendali; jangan menimpa konten resmi; verifikasi RLS/policy, satu akun admin, dan registrasi publik nonaktif.
- [ ] DP-07 — Catat prosedur backup/export database dan media, pemulihan, serta rollback aplikasi/migration sebelum deployment; jangan menganggap backup tersedia tanpa memeriksa fasilitas project.

### 5.2 Deployment dan verifikasi

- [ ] DP-08 — Deploy website publik, admin, dan API Elysia sebagai **satu aplikasi pada satu project Vercel**, tanpa server backend terpisah.
- [ ] DP-09 — Periksa build/deployment log dan pastikan tidak ada secret bocor; validasi HTTPS dan konfigurasi domain jika digunakan.
- [ ] DP-10 — Smoke test produksi: halaman publik/detail, SSR, aset/media, peta/fallback, WhatsApp resmi, metadata, sitemap, robots, dan 404.
- [ ] DP-11 — Smoke test admin terkontrol: login/logout, penyimpanan, publikasi berita/album, edit/hapus dengan modal, upload, serta penolakan akses tanpa sesi. Gunakan konten uji yang jelas dan bersihkan hanya konten uji yang dibuat sendiri.
- [ ] DP-12 — Verifikasi data yang diedit tampil pada publik, tidak ada mock/bypass aktif, dan runtime Elysia/Auth/Storage berfungsi pada Vercel, bukan hanya lokal.
- [ ] DP-13 — Jika ada bug kritis produksi, hentikan peluncuran resmi dan gunakan prosedur rollback yang disepakati; perbaiki dan retest sebelum menyatakan siap.

### 5.3 Handover dan penutupan

- [ ] DP-14 — Serahkan panduan operator singkat: login, ubah konten, berita langsung terbit, album, upload, WhatsApp, konfirmasi hapus, dan pengelolaan password.
- [ ] DP-15 — Serahkan catatan teknis: lokasi migration/seed, nama environment tanpa nilai secret, cara build/deploy, backup/pemulihan, rollback, dan pengecekan log.
- [ ] DP-16 — Serahkan URL website/admin serta akses melalui kanal aman; catat keterbatasan dan data yang masih memerlukan pembaruan resmi.
- [ ] DP-17 — Cocokkan hasil akhir dengan Definition of Done PRD dan minta persetujuan penyelesaian MVP dari pengguna.

**Batas fase:** Tidak menambah fitur pasca-MVP, domain berbayar, layanan tambahan, atau perluasan akun tanpa persetujuan baru.

**Kriteria selesai:** Satu deployment Vercel stabil, Supabase aman, smoke test produksi lulus, kontak resmi berfungsi, status lokasi/media jelas, dokumentasi diserahkan, dan pengguna menerima hasil akhir.

### Gerbang Penutupan

- [ ] G5-01 — Pengguna meninjau website produksi dan hasil smoke test.
- [ ] G5-02 — Pengguna menerima handover dan pengecualian yang masih ada.
- [ ] G5-03 — Pengguna mengonfirmasi **MVP selesai**.

---

## 9. Format Laporan Wajib pada Akhir Setiap Fase

Gunakan format berikut sebelum meminta persetujuan:

```text
Fase: [nomor dan nama]
Status: [siap direview / terblokir / perlu revisi]

Hasil:
- Tugas/fitur selesai dan ID checklist terkait.
- File/halaman/modul utama yang berubah.

Verifikasi:
- Pemeriksaan yang dijalankan, hasil, dan bukti/preview.
- Pemeriksaan yang belum dapat dilakukan beserta alasannya.

Kendala dan catatan:
- Bug/risiko, kebutuhan akses/data, dummy, dan pengecualian.
- Perubahan scope yang membutuhkan keputusan pengguna, bila ada.

Keputusan yang diminta:
- Apakah hasil fase ini disetujui?
- Apakah boleh mulai fase berikutnya: [nomor dan nama]?

Pekerjaan berhenti sampai ada konfirmasi pengguna.
```

## 10. Catatan Persetujuan dan Blocker

### Riwayat persetujuan

| Tanggal | Keputusan | Konfirmasi pengguna | Dampak/status |
|---|---|---|---|
| 21 November 2026 | Mulai Fase 1 | “jika task.md sudah jadi, silahkan kerjakan” | Frontend dimulai; tidak mengizinkan fase berikutnya |
| 21 November 2026 | Arah visual | “Lanjut & izinkan referensi” | Hijau hutan, putih hangat, editorial; referensi eksternal tetap ditolak lingkungan |
| 21 November 2026 | Revisi frontend publik | Pengguna merasa website terlalu kaku/masih AI-slop, meminta animasi atau penyempurnaan lain; “lnjut” | Tetap Fase 1: revisi komposisi, copy dummy, dan motion; bukan izin backend |
| 21 November 2026 | Lokasi kantor | Pengguna mengoreksi tautan menjadi `https://maps.app.goo.gl/FSpoGorPZYV8kv8Y6` | Aktifkan peta kantor di `-1.0258227, 119.9240974`; tautan awal tidak dipakai |
| 22 November 2026 | Revisi border dan kartu | Pengguna meminta animated border referensi 21st.dev, kartu berita lebih ringkas, dan website tetap ringan | Adaptasi native Svelte tanpa dependency baru, border animasi selektif, kartu 3/2/1 kolom; tetap Fase 1, lihat `docs/border-refinement.md` |
| 23 November 2026 | Redesign v2 dan slideshow hero | Pengguna meminta kartu hero memakai foto yang bergeser dari album galeri terbaru secara acak dan lebih rapi | `DESIGN.md` 2.0, `HeroSlides.svelte`, album mock ditambah foto; tetap Fase 1 |
| 24 November 2026 | Slideshow tanpa tombol jeda | Pengguna meminta hero bergeser otomatis dengan animasi halus dan tombol play/pause dihilangkan | Autoplay murni dengan indikator progres; penghentian implisit dipertahankan untuk aksesibilitas; FE-40 dan FE-41 |
| 24 November 2026 | Repositori publik dan perbaikan tampilan | Pengguna meminta `DESIGN.md` dan `TASK.md` masuk `.gitignore`, lalu repo publik dibuat dan di-push | Screenshot tes dan dokumen kerja dikecualikan; referensi klien keluar dari `public/`; FE-44 |
| 24 November 2026 | Perbaikan navbar mobile dan grid galeri | Pengguna melaporkan teks menu tidak terbaca di mobile, lalu grid foto detail album tidak rapi | Dua bug nyata diperbaiki dan dikunci dengan tes regresi; FE-42 dan FE-43 |
| 24 November 2026 | Deploy Vercel ditunda | Pengguna menyatakan masih ingin memperbaiki frontend lebih dulu | Tetap Fase 1; adapter Vercel dan deploy belum dikerjakan |
| 25 November 2026 | Target sentuh 44px | Pengguna menyetujui usulan perbaikan target sentuh | FE-45 selesai dan terverifikasi; tetap Fase 1 |
| 25 November 2026 | **Fase 1 diterima, Fase 2 diizinkan** | Pengguna menyatakan "oke lanjut" setelah laporan target sentuh | G1-01, G1-02, G1-03 disetujui. Fase 2 dimulai dan terblokir menunggu akses Supabase development |
| 25 November 2026 | Migration dijalankan pengguna | Pengguna: "aku sudah jalankan 3 migrasi di sql editor" | Skema, RLS, dan seed ada di database; belum diverifikasi isinya, menunggu `supabase/verify.sql` |
| 25 November 2026 | Akun operator dibuat pengguna | Pengguna memilih "Belum, saya buat sekarang" | Menunggu konfirmasi akun terdaftar di `admin_users` sebelum endpoint tulis diuji |

Tambahkan catatan saat persetujuan benar-benar diterima, bukan berdasarkan asumsi.

### Kebutuhan yang dipantau

| Kebutuhan/risiko | Dibutuhkan pada | Tindakan |
|---|---|---|
| Persetujuan mulai frontend | Sebelum Fase 1 | Sudah diterima; kini menunggu persetujuan hasil frontend dan izin backend |
| Akses/config Supabase development | Fase 2 | Minta saat akan memulai backend; jangan simpan secret di dokumen |
| Ketidakkonsistenan tabel fasilitas | Fase 1–4 | Pertahankan konteks sumber dan minta klarifikasi bila perlu; jangan mengarang angka |
| Koordinat kantor | Fase 1 / review rilis | Tautan koreksi pengguna cocok dengan listing Kantor Desa SOULOWE; peta aktif, peninjauan lapangan tetap dapat dilakukan sebelum rilis |
| Kontak WhatsApp resmi | Sebelum publikasi resmi | Minta nomor pengguna dan ganti dummy |
| Kepala Desa, sambutan, serta media resmi | Review konten sebelum rilis | Ganti dummy atau dokumentasikan persetujuan pemakaian sementara yang tidak menyesatkan |
| Akses Vercel/Supabase target dan keputusan domain | Fase 5 | Konfirmasi target, kepemilikan, dan izin konfigurasi |
| Adapter Vercel | Sebelum deploy | `svelte.config.js` masih `@sveltejs/adapter-auto`; ganti ke `@sveltejs/adapter-vercel` dan uji build sebelum deploy pertama |
| Nama desa "Soulowe" versus "Soulove" | Review konten sebelum rilis | Dokumen profil menulis "Soulove", website memakai "Soulowe". Konfirmasi ejaan resmi ke pihak desa sebelum publikasi |
| Foto ilustrasi Unsplash | Review konten sebelum rilis | Semua foto masih ilustrasi, bukan dokumentasi Soulowe. Ganti dengan foto asli sebelum rilis resmi |

**Langkah berikutnya:** Review hasil pada `docs/phase-1-report.md` dan preview lokal. Tunggu penerimaan frontend dan izin eksplisit **Fase 2 — Backend Development**; G1-01 sampai G1-03 tetap belum dicentang.
