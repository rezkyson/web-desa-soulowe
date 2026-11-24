# Product Requirements Document (PRD)

## Website Informasi dan Profil Desa Soulowe

**Versi:** 1.0  
**Status:** Final untuk MVP  
**Tanggal:** 21 November 2026  
**Bahasa produk:** Bahasa Indonesia  
**Sumber data awal:** `PROFIL_DESA_SOULOWE_2025-2026.docx`  
**Aset awal:** `logo.png`

---

## 1. Ringkasan Produk

Website Desa Soulowe adalah portal informasi resmi yang menyajikan profil desa, pemerintahan, data statistik agregat, keuangan desa, berita, galeri kegiatan, informasi WhatsApp layanan, dan lokasi kantor desa.

Website dibuat sebagai **portal informasi dan profil desa**, bukan sebagai sistem administrasi kependudukan, pelayanan surat online, marketplace, atau sistem pengaduan.

Website publik dan panel admin berada dalam satu aplikasi dan satu deployment Vercel. Operator desa menggunakan satu akun admin untuk memperbarui konten yang bersifat dinamis dan operasional.

---

## 2. Tujuan Produk

### 2.1 Tujuan utama

1. Menyediakan sumber informasi resmi dan mudah diakses tentang Desa Soulowe.
2. Menampilkan profil, sejarah, kondisi, pemerintahan, serta potensi informasi desa secara terstruktur.
3. Menyajikan statistik desa dalam bentuk yang mudah dipahami oleh masyarakat.
4. Mendukung transparansi informasi keuangan desa berdasarkan dokumen sumber.
5. Memudahkan operator desa memperbarui berita, galeri, perangkat desa, statistik, sarana-prasarana, keuangan, dan informasi WhatsApp.
6. Membangun citra digital Desa Soulowe yang modern, bersih, resmi, dan memiliki karakter lokal.

### 2.2 Bukan tujuan MVP

MVP tidak bertujuan untuk:

- Mengelola data individu penduduk.
- Menggantikan sistem administrasi pemerintahan desa.
- Menyediakan pengajuan surat secara online.
- Menyediakan pengaduan masyarakat.
- Menyediakan transaksi atau marketplace UMKM.
- Menampilkan batas wilayah desa.
- Menyediakan login atau akun untuk masyarakat umum.

---

## 3. Target Pengguna

### 3.1 Pengunjung publik

Website ditujukan untuk semua pihak yang membutuhkan informasi tentang Desa Soulowe, antara lain:

- Warga Desa Soulowe.
- Pemerintah dan perangkat desa.
- Masyarakat dari luar desa.
- Lembaga pendidikan, organisasi, dan mitra desa.
- Pihak yang ingin mengetahui kondisi dan informasi Desa Soulowe.

Pengunjung publik tidak perlu membuat akun.

### 3.2 Admin/Operator Desa

Admin adalah operator desa yang bertugas memperbarui konten operasional website.

Ketentuan MVP:

- Hanya ada satu akun admin/operator.
- Tidak ada registrasi publik.
- Tidak ada manajemen multi-user dari panel admin.
- Akun admin dibuat dan dikelola melalui Supabase Auth.

---

## 4. Prinsip Produk dan Konten

1. Informasi resmi harus ditampilkan secara jelas, ringkas, dan mudah dipindai.
2. Data pribadi penduduk tidak boleh ditampilkan.
3. Data statistik hanya berupa data agregat.
4. Konten yang sudah pasti dan bersumber dari dokumen resmi tidak dapat diedit oleh operator.
5. Konten operasional yang dapat berubah harus dapat dikelola operator melalui panel admin.
6. Data awal yang belum resmi, seperti foto dummy, nama Kepala Desa, sambutan, dan nomor WhatsApp, harus mudah diganti.
7. Data keuangan ditampilkan sesuai dokumen sumber tanpa membuat perhitungan atau kesimpulan baru yang tidak tervalidasi.
8. Website menggunakan Bahasa Indonesia.

---

## 5. Identitas Desa dan Data Awal

### 5.1 Identitas yang digunakan

| Atribut | Nilai |
|---|---|
| Nama desa | Desa Soulowe |
| Kecamatan | Sigi Kota |
| Kabupaten | Sigi |
| Alamat | Jln. Bantaya Sigi RT 006 Dusun II |
| Luas wilayah | Mengikuti dokumen: ±5.000 km² |
| Tahun data MVP | 2026 |
| Bahasa | Bahasa Indonesia |

Catatan: terdapat beberapa ketidakkonsistenan penulisan nama pada dokumen sumber, seperti `Soulove` dan `Soulowe`. Nama yang digunakan pada produk adalah **Soulowe**, sesuai keputusan pemilik produk.

### 5.2 Data yang tidak ditampilkan

- Batas wilayah desa.
- Data suku/etnis.
- Data individu penduduk.
- NIK, nomor KK, alamat rumah, atau informasi pribadi lainnya.

### 5.3 Konten tetap

Konten berikut diambil dari dokumen sumber dan disimpan sebagai konten aplikasi yang tidak dapat diedit admin:

- Sejarah Desa Soulowe.
- Asal-usul nama Soulowe.
- Visi desa.
- Misi desa.
- Kondisi geografis.
- Luas wilayah.
- Iklim.
- Penggunaan lahan.
- Tipologi desa.
- Orbitasi atau jarak ke pusat pemerintahan.

Konten tetap dapat diperbarui oleh developer melalui pembaruan aplikasi setelah ada konfirmasi resmi.

### 5.4 Konten dinamis

Konten berikut dikelola melalui Supabase dan dapat diperbarui admin:

- Sambutan Kepala Desa.
- Nama dan foto Kepala Desa.
- Perangkat desa dan BPD.
- Data statistik tahun 2026.
- Sarana dan prasarana.
- Data keuangan tahun 2026.
- Berita.
- Album galeri.
- Nomor WhatsApp layanan.
- Logo dan media website.

---

## 6. Ruang Lingkup MVP

### 6.1 Website publik

- Beranda.
- Profil Desa.
- Pemerintahan Desa.
- Data Desa.
- Keuangan Desa.
- Berita dan detail berita.
- Galeri dan detail album.
- Layanan WhatsApp.
- Kontak dan lokasi kantor desa.

### 6.2 Panel admin

- Login admin.
- Dashboard ringkas.
- Kelola sambutan dan data Kepala Desa.
- Kelola pemerintahan desa.
- Kelola statistik.
- Kelola sarana dan prasarana.
- Kelola keuangan.
- Kelola berita.
- Kelola galeri berbasis album.
- Kelola nomor WhatsApp layanan.
- Kelola media/gambar.
- Pengaturan akun admin.

### 6.3 Di luar scope MVP

- Pengaduan masyarakat.
- Pelayanan surat online.
- Login warga.
- Registrasi publik.
- Data individu penduduk.
- Data suku/etnis.
- Batas wilayah desa.
- Marketplace dan transaksi UMKM.
- Manajemen program per bidang.
- PPID kompleks.
- Integrasi sistem eksternal kependudukan.
- Multi-role dan multi-admin.
- Riwayat beberapa tahun pada tampilan publik.

---

## 7. Sitemap

```text
Beranda
├── Profil Desa
│   ├── Identitas Desa
│   ├── Sejarah Desa
│   ├── Visi dan Misi
│   ├── Kondisi Geografis
│   ├── Sosial Budaya
│   └── Kondisi Ekonomi
├── Pemerintahan Desa
│   ├── Struktur Pemerintahan
│   ├── Perangkat Desa
│   └── BPD
├── Data Desa
│   ├── Kependudukan
│   ├── Pendidikan
│   ├── Mata Pencaharian
│   └── Sarana dan Prasarana
├── Keuangan Desa
├── Berita
│   └── Detail Berita
├── Galeri
│   └── Detail Album
├── Layanan WhatsApp
└── Kontak dan Lokasi
```

---

## 8. Kebutuhan Fungsional Website Publik

### FR-PUB-001 Beranda

Beranda harus menampilkan:

- Identitas Desa Soulowe.
- Foto hero desa.
- Deskripsi singkat desa.
- Tombol menuju Profil Desa.
- Sambutan Kepala Desa.
- Statistik utama desa.
- Berita terbaru.
- Galeri atau album terbaru.
- Ringkasan kondisi/potensi desa yang tersedia pada profil.
- Tombol WhatsApp layanan.
- Lokasi dan kontak kantor desa.

Foto hero dapat menggunakan foto dummy dari Unsplash atau sumber sejenis untuk tahap awal dan dapat diganti dari admin panel.

### FR-PUB-002 Profil Desa

Halaman profil harus menyajikan:

- Identitas desa.
- Sejarah Desa Soulowe.
- Cerita asal-usul nama Soulowe.
- Visi dan misi.
- Kondisi geografis.
- Letak dan luas wilayah.
- Iklim.
- Penggunaan lahan.
- Kondisi sosial budaya.
- Kondisi ekonomi desa.
- Tipologi desa.
- Orbitasi.

Program per bidang tidak ditampilkan sebagai bagian terpisah dalam MVP.

### FR-PUB-003 Pemerintahan Desa

Halaman harus menampilkan:

- Struktur Pemerintah Desa.
- Nama, jabatan, dan pendidikan perangkat desa.
- Foto perangkat desa jika tersedia.
- Data BPD.
- Informasi Dusun I dan Dusun II jika relevan.

Jika data Kepala Desa masih dummy, halaman tetap menampilkan data tersebut dengan status sementara secara internal pada konten awal.

### FR-PUB-004 Data Desa

Halaman data desa harus menampilkan data agregat tahun 2026 dalam bentuk kartu angka, tabel, dan grafik sederhana bila membantu pemahaman.

Subbagian:

- Kependudukan.
- Pendidikan.
- Mata pencaharian.
- Sarana dan prasarana.

Tidak ada data personal penduduk.

### FR-PUB-005 Keuangan Desa

Halaman keuangan harus menampilkan data tahun 2026 dari dokumen sumber:

- Pendapatan Desa.
- Pendapatan Asli Desa.
- Pendapatan transfer.
- Dana Desa.
- Alokasi Dana Desa.
- Pendapatan lain-lain.
- Belanja berdasarkan bidang.

Data ditampilkan sesuai nilai pada dokumen tanpa menghitung ulang total belanja, surplus, defisit, atau kesimpulan keuangan baru.

Halaman harus menampilkan catatan sumber data, misalnya:

> Data keuangan ditampilkan berdasarkan dokumen profil Desa Soulowe Tahun 2026.

### FR-PUB-006 Berita

Pengunjung dapat:

- Melihat daftar berita.
- Melihat berita terbaru.
- Membuka halaman detail berita.
- Melihat judul, ringkasan, isi, gambar utama, kategori, tanggal, dan penulis jika tersedia.
- Membagikan atau menyalin URL berita secara manual.

Berita yang dibuat operator langsung berstatus terbit.

### FR-PUB-007 Galeri

Galeri menggunakan album kegiatan. Setiap album dapat berisi:

- Nama album.
- Tanggal kegiatan.
- Deskripsi.
- Foto unggulan.
- Beberapa foto tambahan.

Pengunjung dapat membuka detail album dan melihat seluruh foto di dalamnya.

### FR-PUB-008 Layanan WhatsApp

Halaman atau section layanan hanya menyediakan informasi WhatsApp:

- Nomor WhatsApp.
- Tombol “Hubungi melalui WhatsApp”.
- Pesan pembuka otomatis.

Tombol membuka URL `https://wa.me/<nomor>` dengan pesan pembuka yang telah ditentukan.

Nomor awal menggunakan dummy dan dapat diubah oleh admin.

### FR-PUB-009 Kontak dan lokasi

Halaman kontak harus menampilkan:

- Nama kantor/desa.
- Alamat: Jln. Bantaya Sigi RT 006 Dusun II.
- Kecamatan Sigi Kota.
- Kabupaten Sigi.
- Nomor WhatsApp layanan.
- Peta lokasi kantor desa.

Peta tidak menampilkan batas wilayah desa.

### FR-PUB-010 Peta

Peta menggunakan library pemetaan yang dapat menampilkan lokasi dan membuka layanan maps eksternal.

Implementasi yang direkomendasikan:

- Leaflet sebagai library peta.
- OpenStreetMap sebagai sumber tile.
- Tombol “Buka di Google Maps” atau layanan maps eksternal yang sesuai.

Lokasi harus menggunakan alamat kantor dari dokumen. Koordinat hasil geocoding wajib diverifikasi sebelum dipublikasikan. Jika koordinat belum terverifikasi, tampilkan alamat dan tautan pencarian maps sebagai fallback, bukan mengklaim koordinat pasti.

---

## 9. Kebutuhan Fungsional Panel Admin

### FR-ADM-001 Login

Admin dapat masuk menggunakan email/username dan password melalui Supabase Auth.

Ketentuan:

- Satu akun admin.
- Tidak ada pendaftaran publik.
- Tidak ada login pengunjung.
- Admin dapat logout.
- Admin dapat mengubah password melalui alur yang aman.
- Halaman admin yang belum terautentikasi harus diarahkan ke halaman login.

### FR-ADM-002 Dashboard

Dashboard menampilkan ringkasan:

- Jumlah berita.
- Jumlah album galeri.
- Tahun data aktif: 2026.
- Shortcut tambah berita.
- Shortcut tambah album.
- Shortcut mengubah WhatsApp.
- Shortcut mengubah sambutan Kepala Desa.

### FR-ADM-003 Sambutan dan Kepala Desa

Admin dapat:

- Mengubah nama Kepala Desa.
- Mengubah foto Kepala Desa.
- Mengubah isi sambutan.
- Menyimpan perubahan.

Konten awal menggunakan dummy dan harus dapat diganti tanpa perubahan kode.

### FR-ADM-004 Pemerintahan Desa

Admin dapat:

- Menambah perangkat desa.
- Mengubah nama, jabatan, dan pendidikan.
- Mengunggah atau mengganti foto.
- Menghapus perangkat dengan modal konfirmasi.
- Mengubah data BPD.
- Menambah, mengubah, dan menghapus anggota BPD dengan modal konfirmasi.

### FR-ADM-005 Statistik

Admin dapat mengubah data statistik tahun 2026 untuk:

- Jumlah total penduduk.
- Jumlah laki-laki.
- Jumlah perempuan.
- Jumlah kepala keluarga.
- Jumlah penduduk miskin/RTM.
- Data pendidikan.
- Data mata pencaharian.

MVP hanya menyediakan satu tahun aktif, yaitu 2026. Struktur data boleh memiliki kolom tahun agar mudah dikembangkan di masa depan.

### FR-ADM-006 Sarana dan prasarana

Admin dapat:

- Menambah sarana/prasarana.
- Mengubah nama, kategori, jumlah, kondisi, dan keterangan.
- Mengunggah foto fasilitas.
- Menghapus item dengan modal konfirmasi.

### FR-ADM-007 Keuangan

Admin dapat mengelola data keuangan tahun 2026:

- Pendapatan.
- Rincian pendapatan.
- Belanja berdasarkan bidang.
- Keterangan sumber data.

Admin tidak disediakan fitur perhitungan surplus/defisit otomatis pada MVP.

### FR-ADM-008 Berita

Admin dapat:

- Menambahkan berita.
- Mengisi judul, ringkasan, isi, kategori, tanggal, penulis, dan gambar utama.
- Menambahkan beberapa foto tambahan jika diperlukan.
- Menerbitkan berita langsung saat disimpan.
- Mengedit berita.
- Menghapus berita dengan modal konfirmasi.

Tidak ada status draft, approval, atau workflow publikasi.

### FR-ADM-009 Galeri

Admin dapat:

- Membuat album kegiatan.
- Mengisi nama album, tanggal, dan deskripsi.
- Mengunggah beberapa foto.
- Menentukan foto unggulan.
- Mengedit album.
- Menambah atau menghapus foto.
- Menghapus album dengan modal konfirmasi.

Album langsung tampil di website setelah disimpan.

### FR-ADM-010 WhatsApp layanan

Admin dapat:

- Mengubah nomor WhatsApp.
- Mengubah pesan pembuka otomatis jika fitur tersebut disediakan pada implementasi.
- Menyimpan perubahan.

Nomor dummy digunakan pada data awal.

### FR-ADM-011 Media dan gambar

Admin dapat mengganti:

- Logo.
- Foto hero.
- Foto Kepala Desa.
- Foto perangkat desa.
- Foto berita.
- Foto album galeri.
- Foto fasilitas.

Batas upload:

- Format: JPG, JPEG, PNG, WebP.
- Ukuran maksimal: 5 MB per file.
- File yang tidak memenuhi validasi ditolak dengan pesan yang jelas.

### FR-ADM-012 Modal konfirmasi

Tindakan destruktif harus menggunakan modal konfirmasi, minimal:

- Menghapus berita.
- Menghapus album.
- Menghapus foto.
- Menghapus perangkat atau anggota BPD.
- Menghapus sarana/prasarana.
- Menghapus data keuangan.
- Mengganti media yang sedang digunakan jika media lama akan dihapus.

Modal harus menyediakan tombol **Batal** dan tombol tindakan yang jelas, misalnya **Hapus**.

---

## 10. Data Awal dari Dokumen

### 10.1 Statistik kependudukan 2026

| Data | Nilai |
|---|---:|
| Total penduduk | 1.127 jiwa |
| Laki-laki | 563 jiwa |
| Perempuan | 564 jiwa |
| Kepala keluarga | 362 KK |
| Penduduk miskin | 76 RTM |

### 10.2 Pendidikan 2026

| Jenjang | Jumlah |
|---|---:|
| Taman Kanak-Kanak | 43 jiwa |
| Tidak tamat SD/Sederajat | 325 jiwa |
| Tamat SD/Sederajat | 334 jiwa |
| Tamat SLTP | 152 jiwa |
| Tamat SLTA | 255 jiwa |
| Tamat D1 | 7 jiwa |
| Tamat D2 | - |
| Tamat D3 | - |
| Tamat S1 | 11 jiwa |
| Tamat S2 | - |
| Jumlah | 1.127 jiwa |

### 10.3 Mata pencaharian 2026

| Mata pencaharian | Jumlah |
|---|---:|
| Petani | 339 jiwa |
| Pedagang/Pengusaha | 19 jiwa |
| Buruh Tani | 537 jiwa |
| Buruh Harian Lepas | 162 jiwa |
| Pertukangan | 19 jiwa |
| Peternak | 29 jiwa |
| PNS/Honorer | 16 jiwa |
| Polri | - |
| TNI | 6 jiwa |
| Karyawan Swasta | - |
| Karyawan BUMN | - |
| Pembantu Rumah Tangga | - |
| TKI/TKW Luar Negeri | - |
| Pengemudi/Tukang Ojek | - |
| Jumlah | 1.127 jiwa |

### 10.4 Pemerintahan desa awal

| Jabatan | Nama | Pendidikan |
|---|---|---|
| Kepala Desa | Dummy / belum tersedia | Dummy |
| Sekretaris Desa (Non PNS) | Harjan | SMA |
| Kepala Urusan Keuangan | Fiska | S1 |
| Kepala Seksi Kesejahteraan (Kesra) | Sri Ayu | SMA |
| Kepala Urusan Umum (Admin & Tata Usaha) | Yolan | SMK |
| Kepala Seksi Pemerintahan | Wiwin Safitri | SMK |
| Kepala Seksi Pelayanan | Trisna Ningsi | SMK |
| Kepala Dusun I | Darlin | - |
| Kepala Dusun II | Sumarlin | - |

### 10.5 BPD awal

| Jabatan | Nama |
|---|---|
| Ketua | Moh Zaman |
| Anggota | Indopai |

### 10.6 Sarana pendidikan

| Jenis | Jumlah |
|---|---:|
| TK/PAUD | 2 unit |
| Sekolah Dasar | 3 unit |
| SLTP | 1 unit |
| SLTA | 1 unit |
| Universitas | 0 unit |

### 10.7 Keamanan

- Pos Kamling: 2 unit.
- Hansip/LINMAS: 5 orang.
- Polmas: 1 orang.
- Babinkamtibmas: 1 orang.

### 10.8 Jalan

| Status jalan | Panjang |
|---|---:|
| Jalan Provinsi | - km |
| Jalan Kabupaten | 2,5 km |
| Jalan Desa | 10 km |
| Jalan Dusun | 3,3 km |

### 10.9 Sarana umum

| Jenis prasarana | Jumlah |
|---|---:|
| TK/PAUD | 2 |
| Sekolah Dasar/Ibtidaiyah | 1 |
| SMP/Tsanawiyah | 0 |
| SMA/SMK | 0 |
| Universitas/Akademi | 0 |
| Perpustakaan/TBM | 0 |
| Masjid | 2 |
| Musholla | 0 |
| Pondok Pertemuan P3A | 0 |
| Balai Dusun | 0 |
| Puskesmas Pembantu | 0 |
| Polindes/Poskesdes | 1 |
| Lapangan Sepak Bola | 1 |
| Lapangan Badminton | 1 |
| Lapangan Voli | 0 |
| Tenis Meja | 0 |
| Tempat Pembuangan Sampah | 7 |

### 10.10 Keuangan desa 2026

#### Pendapatan

- Pendapatan Asli Desa: `-`.
- Pendapatan transfer: `Rp633.307.300`.
- Dana Desa: `Rp259.252.000`.
- Alokasi Dana Desa: `Rp374.055.300`.
- Bantuan keuangan: `-`.
- Pendapatan lain-lain: `-`.

#### Belanja berdasarkan bidang

- Penyelenggaraan Pemerintah Desa: `Rp329.945.000`.
- Pelaksanaan Pembangunan Desa: `Rp364.223.660`.
- Pembinaan Kemasyarakatan Desa: `Rp37.400.000`.
- Pemberdayaan Kemasyarakatan Desa: `Rp188.951.600`.
- Penanggulangan Bencana, Darurat dan Mendesak Desa: `Rp113.000.000`.

Catatan: angka keuangan digunakan sesuai dokumen sumber. Aplikasi tidak melakukan penjumlahan ulang atau menghitung surplus/defisit secara otomatis pada MVP karena terdapat ketidakkonsistenan antara angka pendapatan dan rincian belanja pada dokumen.

---

## 11. Model Data Tingkat Tinggi

Model berikut menjadi acuan awal untuk Supabase PostgreSQL. Nama tabel dapat disesuaikan saat implementasi.

### 11.1 Konten tetap

Konten tetap disimpan dalam kode aplikasi atau file konten terstruktur yang ikut dalam repository. Konten ini tidak memiliki CRUD pada admin panel.

Contoh modul:

```text
src/lib/content/desa.ts
```

### 11.2 Tabel dinamis

- `site_settings`
  - Identitas media aktif, konfigurasi umum, dan metadata website.
- `principal_profile`
  - Nama, foto, dan sambutan Kepala Desa.
- `village_officials`
  - Perangkat desa, jabatan, pendidikan, foto, urutan tampil.
- `bpd_members`
  - Anggota BPD, jabatan, foto opsional, urutan tampil.
- `statistics`
  - Data statistik agregat tahun 2026 dan kategori terkait.
- `facilities`
  - Sarana-prasarana, kategori, jumlah, kondisi, keterangan, foto.
- `financial_data`
  - Ringkasan pendapatan, rincian pendapatan, belanja bidang, tahun.
- `news`
  - Judul, slug, ringkasan, isi, kategori, gambar utama, tanggal, penulis.
- `news_images`
  - Foto tambahan berita.
- `gallery_albums`
  - Nama album, slug, tanggal, deskripsi, foto unggulan.
- `gallery_images`
  - Foto-foto di dalam album.
- `service_contacts`
  - Nomor WhatsApp dan pesan pembuka.
- `media_assets`
  - Metadata file pada Supabase Storage.
- `admin_activity_logs` (opsional untuk MVP)
  - Catatan aktivitas penting admin jika dibutuhkan.

Semua tabel dinamis harus memiliki `created_at` dan `updated_at` jika relevan.

### 11.3 Tahun data

MVP hanya menampilkan tahun 2026. Kolom `tahun` tetap disiapkan pada tabel statistik dan keuangan untuk memudahkan pengembangan multi-tahun tanpa menampilkan selector tahun pada MVP.

---

## 12. Arsitektur Teknologi

### 12.1 Stack

- **Frontend/framework:** SvelteKit.
- **UI:** Svelte.
- **Bahasa:** TypeScript.
- **Runtime/package manager:** Bun.
- **API:** ElysiaJS yang dipasang dalam aplikasi SvelteKit.
- **Database:** Supabase PostgreSQL.
- **Authentication:** Supabase Auth.
- **File storage:** Supabase Storage.
- **Deployment:** satu project Vercel.
- **Peta:** Leaflet + OpenStreetMap, dengan tautan maps eksternal.

### 12.2 Arsitektur deployment

```text
Satu repository
├── SvelteKit: website publik
├── SvelteKit: admin panel
├── ElysiaJS: API internal
└── Vercel: satu deployment

Supabase
├── PostgreSQL
├── Auth
└── Storage
```

Elysia menggunakan handler Web Request/Response pada deployment Vercel dan tidak menjalankan server persisten dengan `app.listen()` pada production.

### 12.3 Environment variables

Minimal:

```env
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` hanya boleh digunakan pada server dan tidak boleh dikirim ke browser.

---

## 13. Keamanan dan Akses Data

1. Supabase Auth digunakan untuk autentikasi admin.
2. Tidak ada akun publik.
3. Halaman admin dilindungi session.
4. Row Level Security (RLS) diterapkan pada tabel Supabase.
5. Data publik hanya dapat membaca data yang memang dipublikasikan.
6. Operasi tulis hanya dapat dilakukan oleh admin terautentikasi.
7. Service role key tidak boleh berada pada kode client.
8. Upload dibatasi pada ekstensi dan ukuran yang diizinkan.
9. Isi berita harus disanitasi untuk mencegah script berbahaya.
10. Penghapusan data penting harus melalui modal konfirmasi.
11. Session dan cookie menggunakan konfigurasi aman melalui Supabase SSR.
12. Tidak ada data pribadi penduduk yang dimasukkan ke database publik.

---

## 14. Kebutuhan Media

### 14.1 Media awal

- Logo menggunakan `logo.png` dari folder project.
- Foto dummy dapat berasal dari Unsplash atau sumber sejenis.
- Foto dummy harus mudah diganti dari panel admin.
- Foto dummy tidak boleh menampilkan seolah-olah dokumentasi resmi Desa Soulowe.

### 14.2 Validasi upload

- Format: JPG, JPEG, PNG, WebP.
- Maksimal 5 MB per file.
- Validasi dilakukan pada client dan server.
- Nama file tidak boleh digunakan langsung sebagai nama path tanpa sanitasi.
- File disimpan di Supabase Storage.
- Metadata media disimpan agar file dapat dikelola dari panel admin.

### 14.3 Struktur folder storage

```text
branding/
profil/
perangkat/
berita/
galeri/
fasilitas/
```

---

## 15. Persyaratan Desain dan UX

### 15.1 Arah visual

Desain harus:

- Modern.
- Clean.
- Resmi tetapi tidak kaku.
- Hangat dan mudah didekati.
- Memiliki karakter Desa Soulowe.
- Berbeda dari tampilan website referensi Towale.
- Tidak terlihat seperti template generik atau **AI slop**.

Logo yang tersedia menjadi dasar identitas, bukan dibuat ulang secara otomatis.

### 15.2 Prinsip anti-AI-slop

Hindari:

- Gradien ungu-biru generik.
- Glassmorphism berlebihan.
- Terlalu banyak kartu dengan radius besar.
- Ornamen dekoratif tanpa fungsi.
- Ikon dari banyak gaya yang tidak konsisten.
- Section yang berulang dengan pola template.
- Judul pemasaran yang bombastis.
- Foto stok yang tidak relevan.
- Layout dashboard yang dipaksakan ke website publik.

Utamakan:

- Tipografi yang kuat.
- Hierarki informasi yang jelas.
- Ruang kosong yang terukur.
- Foto yang relevan.
- Komposisi editorial.
- Data statistik yang mudah dipindai.
- Navigasi yang sederhana.
- Identitas lokal yang subtil dan relevan.

### 15.3 Animasi dan motion

Animasi harus:

- Smooth.
- Singkat.
- Fungsional.
- Tidak berlebihan.
- Tidak mengganggu pembacaan.
- Tidak memperlambat halaman.

Contoh penggunaan:

- Transition ringan pada hover/focus.
- Fade-in section saat masuk viewport dengan penggunaan terbatas.
- Perpindahan halaman yang lembut jika sesuai.
- Feedback saat menyimpan atau menghapus data di admin.
- Animasi angka hanya jika meningkatkan pemahaman.

Hindari parallax berlebihan, animasi looping tanpa fungsi, efek masuk pada setiap elemen, dan loading animation yang terlalu lama.

Implementasi harus menghormati `prefers-reduced-motion`.

### 15.4 Ikon dan grafik

Gunakan ikon dan grafik modern secara selektif jika membantu pemahaman, misalnya:

- Ikon statistik penduduk.
- Ikon fasilitas.
- Ikon WhatsApp.
- Ikon navigasi.
- Grafik pendidikan.
- Grafik mata pencaharian.
- Visual ringkasan keuangan.

Satu sistem ikon yang konsisten harus digunakan di seluruh produk.

### 15.5 Responsive dan aksesibilitas

Website harus mobile-first dan dapat digunakan pada:

- Ponsel Android.
- iPhone.
- Tablet.
- Laptop.
- Desktop.

Persyaratan minimum:

- Kontras teks memadai.
- Ukuran teks nyaman dibaca.
- Tombol mudah disentuh.
- Navigasi mobile jelas.
- Navigasi keyboard dasar tersedia.
- Gambar memiliki alt text.
- Tidak bergantung pada hover.
- Focus state terlihat.
- Empty, loading, dan error state tersedia.

---

## 16. SEO dan Kualitas Teknis

Website harus memiliki:

- Title dan meta description per halaman penting.
- URL berita menggunakan slug yang mudah dibaca.
- Open Graph metadata untuk berita dan halaman utama.
- Sitemap.
- `robots.txt`.
- Favicon menggunakan logo desa.
- Alt text pada gambar.
- Optimasi ukuran gambar.
- Halaman 404.
- HTTPS dari Vercel.
- SSR untuk halaman publik yang membutuhkan SEO.

---

## 17. Kriteria Penerimaan MVP

### Publik

- [ ] Pengunjung dapat membuka beranda tanpa login.
- [ ] Pengunjung dapat membaca profil desa dan konten tetap.
- [ ] Pengunjung dapat melihat pemerintahan desa.
- [ ] Pengunjung dapat melihat statistik agregat 2026.
- [ ] Pengunjung dapat melihat keuangan 2026 sesuai dokumen.
- [ ] Pengunjung dapat membuka daftar dan detail berita.
- [ ] Pengunjung dapat membuka daftar dan detail album galeri.
- [ ] Pengunjung dapat menekan tombol WhatsApp dan diarahkan ke `wa.me`.
- [ ] Pengunjung dapat melihat alamat kantor dan peta.
- [ ] Peta tidak menampilkan batas wilayah desa.
- [ ] Website dapat digunakan pada perangkat mobile.

### Admin

- [ ] Admin dapat login dengan satu akun.
- [ ] Pengguna yang belum login tidak dapat membuka panel admin.
- [ ] Admin dapat mengubah sambutan dan data Kepala Desa.
- [ ] Admin dapat menambah, mengubah, dan menghapus data pemerintahan.
- [ ] Admin dapat mengubah statistik 2026.
- [ ] Admin dapat mengubah sarana dan prasarana.
- [ ] Admin dapat mengubah keuangan 2026.
- [ ] Admin dapat menambah berita dan berita langsung terbit.
- [ ] Admin dapat mengedit dan menghapus berita.
- [ ] Admin dapat membuat, mengedit, dan menghapus album galeri.
- [ ] Admin dapat mengunggah beberapa foto dalam album.
- [ ] Admin dapat mengubah nomor WhatsApp.
- [ ] Admin dapat mengganti media yang digunakan website.
- [ ] Upload menolak format selain JPG, JPEG, PNG, dan WebP.
- [ ] Upload menolak file di atas 5 MB.
- [ ] Tindakan penghapusan menggunakan modal konfirmasi.
- [ ] Admin tidak melihat menu edit untuk sejarah, visi-misi, geografis, iklim, penggunaan lahan, tipologi, dan orbitasi.

### Keamanan dan deployment

- [ ] Aplikasi berjalan sebagai satu project Vercel.
- [ ] Database menggunakan Supabase.
- [ ] Auth admin menggunakan Supabase Auth.
- [ ] Media menggunakan Supabase Storage.
- [ ] Service role key tidak bocor ke client.
- [ ] RLS diterapkan pada tabel dinamis.
- [ ] Tidak ada data individu penduduk pada halaman publik.

---

## 18. Empty State dan Error State

Jika konten belum tersedia, tampilkan pesan yang jelas dan tidak menampilkan layout rusak, misalnya:

- “Belum ada berita yang diterbitkan.”
- “Belum ada album galeri.”
- “Data belum tersedia.”
- “Informasi sedang diperbarui.”

Jika terjadi error:

- Pengunjung mendapat pesan yang mudah dipahami.
- Admin mendapat pesan yang menjelaskan tindakan berikutnya.
- Detail teknis tidak ditampilkan kepada pengunjung.
- Error penting dicatat di log server bila tersedia.

---

## 19. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| Koordinat kantor tidak akurat | Verifikasi hasil geocoding sebelum publikasi dan sediakan tautan pencarian maps sebagai fallback. |
| Angka keuangan tidak konsisten | Tampilkan sesuai dokumen tanpa perhitungan ulang atau kesimpulan baru. |
| Operator salah menghapus konten | Gunakan modal konfirmasi sebelum aksi destruktif. |
| Foto dummy dianggap dokumentasi resmi | Gunakan penanda internal dan ganti sebelum publikasi resmi. |
| Kebocoran service role key | Simpan hanya sebagai environment variable server. |
| Upload file berbahaya | Validasi MIME, ekstensi, ukuran, dan proses upload di server. |
| Website lambat karena foto | Batasi ukuran, optimalkan gambar, dan gunakan storage eksternal. |
| Konten tetap berubah tanpa verifikasi | Kunci dari admin dan ubah melalui update aplikasi. |
| Animasi mengganggu pengguna | Gunakan motion secara terbatas dan dukung reduced motion. |

---

## 20. Asumsi dan Catatan Implementasi

1. Tahun saat ini untuk MVP adalah 2026.
2. Domain akan dibahas setelah PRD dan implementasi awal siap.
3. Koordinat kantor desa belum dianggap final sebelum diverifikasi.
4. Data dummy Kepala Desa, sambutan, WhatsApp, dan media dapat digunakan pada tahap pengembangan.
5. Nomor WhatsApp dummy wajib diganti sebelum website dianggap siap dipublikasikan secara resmi.
6. Logo awal menggunakan file `logo.png` yang telah tersedia.
7. Konten tetap tidak memerlukan tabel CRUD admin.
8. Data tahun disiapkan pada model database, tetapi selector tahun dan arsip multi-tahun belum dibuat pada MVP.
9. Program per bidang tidak dimasukkan dalam website MVP.
10. Perubahan domain, akun Vercel, project Supabase, dan koordinat final merupakan pekerjaan konfigurasi deployment sebelum peluncuran.

---

## 21. Definition of Done

MVP dianggap selesai apabila:

1. Seluruh halaman publik pada sitemap tersedia.
2. Data awal dari dokumen telah dimasukkan dan ditampilkan dengan format yang benar.
3. Konten tetap tidak dapat diedit dari panel admin.
4. Seluruh modul dinamis dapat dikelola oleh satu akun admin.
5. Berita dapat dibuat dan langsung terbit.
6. Galeri dapat dikelola dalam bentuk album.
7. Data statistik dan keuangan 2026 tersedia.
8. WhatsApp dan lokasi kantor dapat digunakan.
9. Media dapat diunggah sesuai batas format dan ukuran.
10. Aksi destruktif menggunakan modal konfirmasi.
11. Website responsive, accessible secara dasar, dan memiliki state loading/empty/error.
12. Visual mengikuti arah modern, clean, smooth, dan anti-AI-slop.
13. Aplikasi berhasil dideploy sebagai satu project Vercel.
14. Supabase Auth, Database, dan Storage berjalan dengan aman.
15. Tidak ada data dummy kritis yang tertinggal sebelum peluncuran resmi tanpa penanda atau persetujuan pemilik.
