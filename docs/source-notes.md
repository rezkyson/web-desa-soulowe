# Catatan sumber dan data development

Dokumen `PROFIL_DESA_SOULOWE_2025-2026.docx` dibaca dari XML paragraf dan 16 tabel pada Fase 1. Aset asli tidak diubah. PRD tetap menjadi keputusan produk ketika berbeda dari ejaan sumber.

## Konten tetap

`src/lib/content/desa.ts` memuat sejarah pemekaran Watunonju, Ranjambalagi, Yalimuru, Amin Letawa, Lahudo Gerorante, tahun 1968, asal-usul nama, visi dan empat misi, geografis, iklim, penggunaan lahan, tipologi, orbitasi, sosial, dan ekonomi. Nama produk dinormalisasi Soulowe sesuai PRD; tidak ada data etnis, batas wilayah, atau program per bidang.

## Perbedaan yang tidak dikoreksi otomatis

1. Nama sumber Soulove/Soulowe: website memakai Soulowe berdasarkan keputusan pengguna.
2. Luas `±5.000 km²` dipertahankan berdasarkan PRD; tidak dikonversi sendiri.
3. Penggunaan lahan memuat pasangan km² dan ha yang tidak konsisten: sawah `±2,5 km² (2.500 ha)`, ladang/perkebunan `±1 km² (1.000 ha)`, permukiman `±4 km² (400 ha)`. Website mempertahankan angka serta menyertakan catatan.
4. Tabel sarana pendidikan: SD 3, SLTP 1, SLTA 1; tabel sarana umum: SD/Ibtidaiyah 1, SMP 0, SMA 0. Kategori dipisah sesuai tabel sumber, tidak digabungkan.
5. Letak/luas menyebut jarak kecamatan/kabupaten 10 km dan provinsi 20 km. Orbitasi menyebut kecamatan ±7 km, kabupaten ±10 km, provinsi ±18 km. Tampilan Orbitasi menggunakan bagian Orbitasi dan mengungkapkan perbedaan sumber.
6. Narasi geografis menyebut lembah/dataran rendah, tabel tipologi memberi “Ya” untuk pegunungan dan perkotaan. Keduanya disajikan sesuai konteks tanpa menyimpulkan ulang.
7. Narasi iklim menyebut Sigi Biromaru, tetapi identitas produk mengikuti Kecamatan Sigi Kota berdasarkan keputusan pengguna.
8. Pendapatan Rp633.307.300 dan rincian belanja tidak konsisten. Tidak ada total belanja/perhitungan surplus/defisit otomatis.
9. `-` di sumber menjadi null/`—`, bukan angka nol. RTM dipertahankan sebagai rumah tangga miskin, bukan jiwa.
10. Nama Kepala Desa tidak tersedia; pendidikan pada sumber SMA, sedangkan PRD memperbolehkan data Kepala Desa dummy. UI tidak mengklaim identitas/foto resmi tersedia.

## Dummy dan aset

- Nama Kepala Desa: “Kepala Desa Soulowe” sebagai label sementara, tanpa mengarang nama orang.
- Sambutan: teks sementara berpenanda.
- Foto Kepala Desa/perangkat: placeholder, bukan foto orang yang disalahatribusikan.
- WhatsApp: `6281234567890`, **dummy**, jangan dipakai layanan resmi atau pengiriman data pribadi.
- Semua berita dan album awal: konten contoh, ditandai internal `dummy` dan diberi pemberitahuan publik.
- Gambar stok Unsplash disimpan lokal pada `static/images/`; bukan dokumentasi Soulowe.
  - `landscape.jpg`: ID aset `photo-1500382017468-9049fed747ef`, ilustrasi lanskap ladang.
  - `field.jpg`: ID aset `photo-1500937386664-56d1dfef3854`, petani di ladang; foto ilustrasi.
  - `seedlings.jpg`: ilustrasi bibit tanaman di persemaian.
  - `fields.jpg`: ilustrasi hasil panen sayur di pasar.
  - `village.jpg` pernah dipakai pada eksplorasi awal, lalu dihapus karena menampilkan landmark yang tidak mewakili konteks Soulowe. Jangan dipakai kembali.
  - Sumber unduhan `https://images.unsplash.com/<ID>?auto=format&fit=crop&w=1600&q=85`. Tinjau kembali pilihan/lisensi/atribusi sebelum peluncuran.
- Referensi visual klien disimpan di `docs/reference/new-refrensi.jpeg`, bukan di `public/`, supaya tidak ikut ter-deploy sebagai URL publik.
- Logo: salinan identik `logo.png` ke `static/logo.png`; asli dipertahankan.
- Koordinat kantor diperbarui dari tautan koreksi pengguna: `https://maps.app.goo.gl/FSpoGorPZYV8kv8Y6`. Listing bernama **Kantor Desa SOULOWE**, kategori Kantor Pemda, Jl. Bantaya, Soulowe, Sigi Kota. Koordinat destinasi pada URL petunjuk arah: `-1.0258227, 119.9240974`. Ini verifikasi terhadap tautan pengguna/listing, bukan survei lapangan. Peta Leaflet + OpenStreetMap telah aktif tanpa batas wilayah.
- Tautan awal `1XCrUJKv7TV6WKte9` ditolak setelah pengguna mengonfirmasi itu hanya lokasi desa; tidak digunakan sebagai pin kantor. Pusat viewport awal Google Maps juga tidak dipakai sebagai koordinat tempat.
