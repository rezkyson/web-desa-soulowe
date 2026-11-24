# Laporan Fase 1 — Frontend Development

**Tanggal:** 21 November 2026  
**Status:** Siap direview pengguna — bukan aplikasi produksi  
**Checklist:** FE-01–FE-39 telah diimplementasikan/didokumentasikan; gerbang G1 masih menunggu pengguna.

## Hasil

- Project SvelteKit/Svelte + TypeScript dan Bun, font lokal, ikon Lucide, CSS responsif dengan hijau hutan dan putih hangat.
- Publik: beranda, profil, pemerintahan/BPD, data agregat, fasilitas, keuangan 2026, daftar/detail berita, daftar/detail album, WhatsApp, kontak, dan halaman tidak ditemukan.
- Admin demo: login/logout, dashboard, sambutan/Kepala Desa, pemerintahan/BPD, statistik, fasilitas, keuangan, berita, album, WhatsApp, media, dan simulasi perubahan password.
- Simulasi CRUD dalam memori; modal konfirmasi; preview upload; multi-foto dan unggulan album; validasi client; state loading/kosong/error; feedback submit berhasil/gagal.
- Konten tetap terpisah dari mock. Tidak tersedia menu CRUD sejarah, visi-misi, geografis, iklim, penggunaan lahan, tipologi, atau orbitasi.
- Metadata dasar, favicon, robots admin noindex, dan kerangka sitemap. Domain/SEO dinamis final belum dikerjakan.

## Preview

Production build lokal yang telah diperiksa:

- Publik: http://127.0.0.1:4173/
- Admin demo: http://127.0.0.1:4173/admin/login
- Email contoh: `operator@example.com`; password contoh: `contoh123` (bukan akun server).
- Jangan gunakan email/password asli. Password tidak dikirim/disimpan. Reload menghapus perubahan dan sesi demo.

Untuk menjalankan kembali:

```sh
bun install
bun run check
bun run build
bun run preview -- --port 4173
```

Jangan menjalankan dev server saat membuat build atau saat memverifikasi build: SvelteKit memakai direktori generated yang sama. Pada pemeriksaan awal terjadi ketidaksesuaian identifier bootstrap client/server ketika beberapa dev server aktif bersamaan dengan build. Menghentikan server development milik pekerjaan ini, build ulang, dan memulai preview baru menyelesaikan masalah; smoke check produksi kemudian lulus.

## Verifikasi yang benar-benar dijalankan

| Pemeriksaan | Hasil |
|---|---|
| `bun run check` | 0 error, 0 warning |
| `bun run build` tanpa dev server aktif | Lulus; adapter-auto belum dikonfigurasi target Vercel karena deploy fase terpisah |
| Smoke Chromium pada dev server | 36 kelompok pemeriksaan lulus |
| Smoke Chromium pada production preview port 4173 | 36 kelompok pemeriksaan lulus; tidak ada `pageerror` pada alur diperiksa |
| Public viewport 390 / 768 / 1440 px | Tidak ada overflow halaman pada halaman yang diperiksa |
| Admin desktop/mobile/tablet | Navigasi, tabel dengan scroll lokal, dashboard, dan editor diperiksa |
| Pemeriksaan visual screenshot | Beranda desktop/mobile/tablet, dashboard, editor mobile, profil/data tablet ditinjau |
| Detector Impeccable statis | Dua temuan warning visual side-tab pada notice dan signature; bukan lulus tanpa temuan |

Bukti mesin: `docs/smoke-results.json`. Screenshot: `docs/screenshots/`. Script dapat diulang dengan `PREVIEW_URL=http://127.0.0.1:4173` dan `bun run test:smoke` setelah preview berjalan.

Alur yang tercakup mencakup seluruh route publik utama dan detail contoh; menu mobile; 404 dan konten tidak ditemukan; lightbox; login demo; halaman modul admin; tambah/edit/hapus perangkat, batal/konfirmasi hapus dan fokus Batal; statistik; berita langsung terbit pada mock, foto utama, error submit; album multi-upload dan foto unggulan; penolakan SVG dan file >5 MB; WhatsApp; pemilihan media dengan konfirmasi; validasi password contoh dan logout; error-state retry.

## Batasan dan catatan

- Semua operasi masih frontend. Belum ada Supabase, database, API Elysia, Auth aman, Storage, RLS, atau persistensi server. Jangan men-deploy prototype ini sebagai sistem admin produksi.
- Pengujian ini pemeriksaan dasar Fase 1, **bukan Fase 4/UAT final**. Firefox, Safari/iPhone/Android fisik, audit WCAG/kontras menyeluruh, performa terukur, API/keamanan/RLS, dan kegagalan server nyata belum diuji.
- Cabang peta Leaflet tersedia secara client-only, namun belum dijalankan karena koordinat kantor belum terverifikasi. Fallback alamat dan pencarian Google Maps digunakan tanpa klaim pin pasti.
- Detail slug mock yang hilang menunjukkan UI not-found; status HTTP detail berbasis database diselesaikan pada integrasi. Sitemap saat ini kerangka; OG domain absolut final belum ada.
- Identitas/sambutan Kepala Desa, nomor WhatsApp, berita/album dan media masih dummy/ilustrasi, bukan publikasi resmi.
- Angka sumber yang tidak konsisten tetap dicatat dan tidak dikoreksi otomatis. Tidak ada perhitungan ulang total belanja/surplus/defisit.
- Instruksi utama skill Impeccable dimuat, namun file referensi pendukung tetap ditolak izin baca lingkungan. Tidak mengklaim seluruh playbook tersedia.
- Detector menandai garis samping notice/signature sebagai pola visual yang disarankan ditinjau. Tetap tercatat untuk review; bukan masalah fungsi atau bukti audit desain menyeluruh.

## Dokumen handoff

- `DESIGN.md`: arah visual dan tokens.
- `PRODUCT.md`: keputusan produk yang telah disetujui.
- `docs/frontend-contract.md`: rancangan field, operasi, respons error, upload, dan relasi untuk backend; belum endpoint nyata.
- `docs/source-notes.md`: sumber konten, perbedaan data, serta daftar dummy/media.
- `README.md`: menjalankan dan memeriksa project lokal.

## Keputusan pengguna yang diperlukan

### Pembaruan 22 November — border dan kartu

Revisi berdasarkan referensi AnimatedBorder 21st.dev: native Svelte di `src/lib/components/ui/AnimatedBorder.svelte` tanpa memasang React/shadcn/Tailwind. Berita sekarang grid kartu ringkas 3/2/1 kolom dengan border hijau bergerak 1px; judul/ringkasan dibatasi 2 baris dengan detail lengkap lewat tautan. Galeri dan permukaan terpilih mendapat border statis. Pola berita satu-utama/dua-pendamping pada laporan sebelumnya digantikan layout terbaru ini.

Build/check berhasil, 9 pemeriksaan border dan 7 pemeriksaan motion lulus di preview produksi. Efek berhenti offscreen/tab tidak aktif dan menjadi statis saat reduced-motion. Tidak ada loop JS per-frame atau dependensi baru. Detail dan screenshot: `docs/border-refinement.md`, `docs/screenshots/borders/`. Hasil frontend tetap menunggu persetujuan pengguna; tidak memulai backend.

### Pembaruan — peta kantor aktif

Pengguna memberikan tautan koreksi `https://maps.app.goo.gl/FSpoGorPZYV8kv8Y6`. Listing cocok dengan Kantor Desa SOULOWE, Jl. Bantaya, Sigi Kota. Koordinat destinasi petunjuk arah `-1.0258227, 119.9240974` dipakai, bukan pusat viewport Google Maps. Catatan sebelumnya tentang koordinat belum tersedia kini digantikan pembaruan ini.

Peta Leaflet + OpenStreetMap tampil pada beranda dan kontak, dengan pin/popup kantor, kontrol zoom, atribusi, serta tautan Google Maps yang tetap ada ketika tile gagal atau JavaScript nonaktif. Tidak ada batas wilayah. Ini kecocokan terhadap lokasi dari pengguna, bukan survei lapangan.

Verifikasi production preview: check 0 error/0 warning, build lulus, 4 pemeriksaan peta (tile nyata desktop/mobile, marker/popup, atribusi, zoom, external link, simulasi tile gagal, no-JS link) dan 36 smoke check frontend lulus. Bukti: `docs/map-results.json`, `docs/screenshots/map/1440.png`, `docs/screenshots/map/390.png`. Detector file peta tidak melaporkan temuan (`docs/impeccable-map.json`).

### Pembaruan — revisi visual dan motion

Menindaklanjuti feedback pengguna bahwa website terasa kaku dan masih seperti template, frontend publik diperhalus tanpa memulai backend:

- Hero terang dengan judul lugas “Selamat datang di Soulowe”, foto dominan, dan navigasi cerita.
- Cerita asal-usul memakai tahun 1968 dari dokumen; angka dan konten tetap tidak diubah.
- Susunan berita satu utama dan dua pendamping; galeri memiliki perbedaan proporsi/offset, bukan grid seragam.
- Sambutan serta copy beranda lebih sederhana, tidak memakai pola slogan berulang.
- Animasi foto hero sekali, reveal kelompok terpilih saat discroll, hover/link/menu, dan View Transition navigasi publik bila browser mendukung.
- Tidak ada parallax, scroll-jacking, angka berputar, typing effect, atau loop dekoratif. Reduced-motion dan fallback tanpa JavaScript diperiksa. Fokus keyboard langsung menampilkan konten yang belum ter-reveal.
- Admin tetap mempertahankan tampilan fungsional; bukan objek redesign ini. Data dan operasi tetap mock.

Verifikasi revisi: `bun run check` 0 error/0 warning; production build lulus; 36 smoke check dan 7 pemeriksaan motion lulus pada preview produksi port 4173. Screenshot revisi tersedia di `docs/screenshots/refinement/`, bukti motion di `docs/motion-results.json`. Detector atas file revisi tidak menemukan pola yang dilaporkannya (`docs/impeccable-refinement.json` berisi `[]`); ini bukan jaminan estetika bebas AI-slop atau pengganti review pengguna. Peringatan detector lama pada CSS dasar tetap merupakan catatan historis, bukan hasil scan menyeluruh terbaru.

Revisi masih memerlukan dokumentasi asli Soulowe untuk karakter lokal yang kuat; foto yang digunakan tetap ilustrasi. Pengujian browser lain dan audit penuh tetap Fase 4.

1. Apakah hasil Fase 1 disetujui, atau ada revisi frontend?
2. Jika disetujui, apakah boleh memulai **Fase 2 — Backend Development**?

Backend, integrasi, testing menyeluruh, dan deploy belum dimulai. Pekerjaan berhenti pada gerbang ini sampai ada konfirmasi pengguna.
