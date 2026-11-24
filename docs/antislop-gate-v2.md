# Delivery Gate: redesign v2 (antislop)

Tanggal: 23 November 2026. Mode: `during` (session override).
Cakupan: permukaan publik (hero + halaman dalam) dan token global. Admin hanya menerima palet baru, tidak didesain ulang.

## Design Read dan dial

- Publik: `ENERGY 3 / RHYTHM 3 / MOTION 2`. Admin: `1 / 1 / 1`. Tertulis di `DESIGN.md`.
- Referensi klien dipakai untuk komposisi hero. Bagian lain mengikuti `DESIGN.md`.

## Block 1: Hard Gate

| Aturan | Status | Bukti |
|---|---|---|
| R-02 tanpa em dash | PASS | Pemindaian `src/` dan `scripts/` = 0 karakter U+2014. 27 kemunculan lama diganti `-` atau titik dua. |
| R-03 mobile tanpa luber | PASS | 360/390/768/1440 px: `scrollWidth <= innerWidth` pada 9 halaman, dua breakpoint di `smoke.mjs`. |
| R-17 angka tanpa sumber | PASS | Hanya 1.127, 563, 564, 362, 76, 1968 dari dokumen profil. Tidak ada angka pengguna fiktif. |
| R-18 testimoni palsu | PASS | Tidak ada bagian testimoni. Deretan avatar + "10K+ users" dari referensi sengaja tidak dipakai. |
| R-23 aset tanpa izin | PASS | Logo asli, foto Unsplash berlabel ilustrasi, identitas Kepala Desa placeholder eksplisit. |
| R-24 nav tujuan nyata | PASS | 8 item nav, semuanya diuji klik dan mendarat di halaman dengan `h1`. |
| R-25 kontras AA | PASS | Nav putih di atas hero 14,6:1 sampai 15,3:1. CTA limau 8,83:1. Hero h1 5,62:1 terburuk. Body `--text` 7,15:1. |
| R-26 kontrol berfungsi | PASS | 30 kontrol diklik, hasil dicatat di `docs/clickthrough-v2.md`. |
| R-27 state UI | PASS | `State.svelte` (loading, kosong, error) plus preview di dashboard admin. |
| R-28 FAQ generik | PASS | Tidak ada FAQ. |
| R-32 keyboard | PASS | Tab pertama mencapai skip link, dialog menutup dengan Escape, fokus terlihat. |
| R-33 tanpa patch skrip | PASS | Semua perubahan ditulis di sumber. Skrip string-replace inline dibatalkan. |
| R-34 tema konsisten | PASS | Satu tema, tidak ada toggle yang setengah jadi. |
| R-35 dijalankan dan diklik | PASS | Build lulus, 30 kontrol diklik, 0 error konsol. |
| R-36 klaim palsu | PASS | Tidak ada klaim keamanan atau performa. |
| R-37 design direction | PASS | `DESIGN.md` versi 2.0 ditulis sebelum implementasi. |
| R-38 konten jujur | PASS | Konten contoh diberi label "Konten contoh" dan "foto ilustrasi". |
| R-39 semantik dan afordansi | PASS | Kontrol native, `cursor: pointer`, label terlihat, `alt` di semua gambar, reduced motion dihormati. Slideshow hero berjalan tanpa tombol jeda atas permintaan klien, tetapi tetap berhenti saat tab tidak aktif, kartu di luar layar, dan reduced motion, dan indikator progresnya berfungsi sebagai dot navigasi. |
| R-40 mekanisme performa | PASS | Semua gambar punya `width`/`height`, hero `fetchpriority="high"` tanpa lazy, tanpa skrip pihak ketiga di `head`. |

## Block 2: Purpose-Gate

| Teknik | Alasan tertulis | Status |
|---|---|---|
| Kaca di kartu hero | Satu-satunya elemen kaca, memisahkan informasi kantor dari foto | PASS (1 elemen) |
| Gradien scrim hero | Menjamin kontras teks di seluruh area foto, bukan dekorasi | PASS |
| Tombol pil di hero | Radius besar khusus aksi utama hero, kontrol lain 6 px | PASS |
| Seal melingkar | Motif identitas desa, statis, tidak butuh kontrol jeda | PASS |
| Slideshow foto hero | Dokumentasi ambient dari album terbaru; berjalan tanpa tombol jeda atas permintaan klien, dengan penghentian implisit dan indikator progres | PASS |
| Ikon Lucide | Dipilih karena relevansi (peta, dokumen, kamera, telepon) | PASS |
| Border animasi berita | Menandai berita utama di antara pendamping, 1 px, hanya saat terlihat | PASS |
| Bayangan kartu | Hanya kartu hero yang terangkat di atas foto | PASS |

## Block 3: Liveliness

- Dial dinyatakan dan konsisten: hero besar, pita data tenang, cerita asimetris, sambutan satu panel, berita utama + dua baris, panel hijau, galeri dua proporsi, peta.
- Focal point per layar: hero h1, lalu judul bagian.
- Whitespace struktural: jarak bagian berbeda (92, 66, 52 px) bukan satu nilai.
- Aksen tunggal: hijau limau hanya pada CTA sekunder, penanda aktif, dan angka penting di gelap.
- Motif identitas: hijau berlapis + seal + tipografi rapat.
- Design Read dinyatakan sebelum implementasi.

## Block 4: Craftsmanship dan Quality Locks

- C-1 sampai C-5: tidak ada keputusan yang hanya beralasan "default AI"; semua interaksi berfungsi; tidak ada bagian pengisi template; tahan di semua state dan breakpoint; tidak ada klaim palsu.
- R-05: struktur mengikuti isi, bukan template hero + 3 kartu + FAQ.
- R-11: radius 6/14/24 px, bukan serba pil.
- R-15: CTA spesifik, misalnya "Kenali desa kami" dan "Data lengkap".
- R-16: tidak ada buzzword.
- R-20: identitas Soulowe, bukan salinan produk lain.
- R-21: satu tema dipilih karena alasan merek, bukan gelap sebagai tren.
- R-29: 3 warna inti ditambah netral.
- R-30: referensi dipakai sebagai inspirasi komposisi, bukan tiruan.
- R-31: alasan setiap keputusan tertulis pada tabel di `DESIGN.md`.

## Catatan jujur tentang batasan

- Ini masih fase frontend dengan data mock. Login admin bukan autentikasi nyata dan `/admin` dapat diakses publik jika di-deploy sekarang.
- Foto masih ilustrasi. Karakter lokal akan jauh lebih kuat dengan dokumentasi asli Soulowe.
- Pengujian memakai Chromium. Firefox, Safari, dan perangkat fisik belum diuji; itu bagian Fase 4.
- Detector Impeccable atas berkas revisi mengembalikan `[]`. Itu bukan jaminan estetika.
- Angka kontras diukur dengan `contrast-check.py` dan sampling piksel screenshot, bukan audit manual seluruh halaman.

## Hasil

Semua blok PASS. Tidak ada FAIL yang tersisa.

Suite: `test:smoke` 36, `test:motion` 7, `test:borders` 9, `test:map` 4, `hero-slides` 12, click-through 30 kontrol, `bun run check` 0 error dan 0 warning, build produksi lulus.
