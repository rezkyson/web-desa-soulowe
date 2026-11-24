import type { DemoData, Entry, Statistic } from '$lib/types';

export const images = {
  landscape: '/images/landscape.jpg',
  field: '/images/field.jpg',
  fields: '/images/fields.jpg',
  seedlings: '/images/seedlings.jpg'
};
const stats = (category: string, values: [string, number | null][], unit = 'jiwa'): Statistic[] => values.map(([name, value], i) => ({ id: `${category}-${i}`, name, value, unit, category }));
const facilities = (category: string, rows: [string, number | null][], unit = 'unit'): Entry[] => rows.map(([name, value], i) => ({ id: `${category}-${i}`, name, value, unit, category, condition: '', note: `Sumber: ${category}` }));
const officials = [
  ['Harjan', 'Sekretaris Desa (Non PNS)', 'SMA'], ['Fiska', 'Kepala Urusan Keuangan', 'S1'], ['Sri Ayu', 'Kepala Seksi Kesejahteraan', 'SMA'],
  ['Yolan', 'Kepala Urusan Umum', 'SMK'], ['Wiwin Safitri', 'Kepala Seksi Pemerintahan', 'SMK'], ['Trisna Ningsi', 'Kepala Seksi Pelayanan', 'SMK'],
  ['Darlin', 'Kepala Dusun I', '-'], ['Sumarlin', 'Kepala Dusun II', '-']
].map(([name, role, education], i) => ({ id: `official-${i}`, name, role, education, order: i + 1 }));
const news: Entry[] = [
  { id: 'news-1', name: 'Mengenal pertanian dan kehidupan masyarakat Soulowe', slug: 'mengenal-pertanian-soulowe', category: 'Kabar Desa', date: '2026-11-18', summary: 'Sekilas tentang pertanian sebagai bagian penting dari kehidupan dan mata pencaharian warga.', body: 'Soulowe merupakan desa agraris. Dokumen profil tahun 2026 mencatat buruh tani dan petani sebagai mata pencaharian yang paling dominan.\n\nHalaman ini merupakan contoh tampilan berita untuk tahap pengembangan, bukan laporan kegiatan resmi. Operator dapat mengganti judul, isi, tanggal, dan foto ketika backend telah terhubung.', photo: images.field, author: 'Operator Desa', dummy: true, photos: [] },
    { id: 'news-2', name: 'Informasi desa yang lebih dekat dengan masyarakat', slug: 'informasi-desa-untuk-masyarakat', category: 'Informasi', date: '2026-11-14', summary: 'Profil, data agregat, dan informasi pemerintah desa dalam satu ruang yang mudah diakses.', body: 'Website ini disiapkan untuk memudahkan akses informasi Desa Soulowe. Informasi yang disajikan meliputi profil, pemerintahan, statistik, dan keuangan.\n\nIni merupakan konten contoh untuk melihat rancangan halaman berita. Tidak ada peristiwa atau pengumuman resmi yang dinyatakan melalui konten ini.', photo: images.landscape, author: 'Operator Desa', dummy: true, photos: [] },
  { id: 'news-3', name: 'Membaca profil dan data Desa Soulowe tahun 2026', slug: 'profil-dan-data-soulowe-2026', category: 'Data Desa', date: '2026-11-10', summary: 'Mengenal desa lewat informasi kependudukan, pendidikan, dan sarana-prasarana.', body: 'Data agregat membantu masyarakat memahami gambaran desa tanpa membuka data pribadi penduduk.\n\nBerita ini adalah konten contoh. Angka resmi yang tersedia dapat dibaca pada halaman Data Desa dengan mengacu pada dokumen profil 2025–2026.', photo: images.landscape, author: 'Operator Desa', dummy: true, photos: [] }
];
export const seed: DemoData = {
  principal: { name: 'Kepala Desa Soulowe', greeting: 'Selamat datang di website Desa Soulowe. Ruang informasi ini kami hadirkan agar masyarakat dapat mengenal desa, mengakses data, dan mengikuti kabar desa dengan lebih mudah. Mari bersama menjaga kebersamaan dan membangun desa dengan semangat pelayanan.\n\nSambutan ini adalah teks sementara untuk pengembangan dan akan diganti dengan sambutan resmi Kepala Desa.', photo: '', dummy: true },
  settings: { logo: '/logo.png', hero: images.landscape },
  contact: { phone: '6281234567890', message: 'Halo Pemerintah Desa Soulowe, saya ingin mendapatkan informasi.', dummy: true },
  officials,
  bpd: [{ id: 'bpd-1', name: 'Moh Zaman', role: 'Ketua', order: 1 }, { id: 'bpd-2', name: 'Indopai', role: 'Anggota', order: 2 }],
  statistics: [
    ...stats('Kependudukan', [['Total penduduk', 1127], ['Laki-laki', 563], ['Perempuan', 564]]),
    { id: 'kk', name: 'Kepala keluarga', value: 362, unit: 'KK', category: 'Kependudukan' },
    { id: 'rtm', name: 'Rumah tangga miskin', value: 76, unit: 'RTM', category: 'Kependudukan' },
    ...stats('Pendidikan', [['Taman Kanak-Kanak', 43], ['Tidak tamat SD/Sederajat', 325], ['Tamat SD/Sederajat', 334], ['Tamat SLTP', 152], ['Tamat SLTA', 255], ['Tamat D1', 7], ['Tamat D2', null], ['Tamat D3', null], ['Tamat S1', 11], ['Tamat S2', null]]),
    ...stats('Mata pencaharian', [['Petani', 339], ['Pedagang/Pengusaha', 19], ['Buruh tani', 537], ['Buruh harian lepas', 162], ['Pertukangan', 19], ['Peternak', 29], ['PNS/Honorer', 16], ['Polri', null], ['TNI', 6], ['Karyawan swasta', null], ['Karyawan BUMN', null], ['Pembantu rumah tangga', null], ['TKI/TKW luar negeri', null], ['Pengemudi/Tukang ojek', null]])
  ],
  facilities: [
    ...facilities('Sarana pendidikan', [['TK/PAUD', 2], ['Sekolah Dasar', 3], ['SLTP', 1], ['SLTA', 1], ['Universitas', 0]]),
    ...facilities('Keamanan', [['Pos Kamling', 2]]), ...facilities('Keamanan', [['Hansip/LINMAS', 5], ['Polmas', 1], ['Babinkamtibmas', 1]], 'orang').map((r, i) => ({ ...r, id: `personel-${i}` })),
    ...facilities('Jalan', [['Jalan Provinsi', null], ['Jalan Kabupaten', 2.5], ['Jalan Desa', 10], ['Jalan Dusun', 3.3]], 'km'),
    ...facilities('Sarana umum', [['TK/PAUD', 2], ['Sekolah Dasar/Ibtidaiyah', 1], ['SMP/Tsanawiyah', 0], ['SMA/SMK', 0], ['Universitas/Akademi', 0], ['Perpustakaan/TBM', 0], ['Masjid', 2], ['Musholla', 0], ['Pondok Pertemuan P3A', 0], ['Balai Dusun', 0], ['Puskesmas Pembantu', 0], ['Polindes/Poskesdes', 1], ['Lapangan sepak bola', 1], ['Lapangan badminton', 1], ['Lapangan voli', 0], ['Tenis meja', 0], ['Telepon umum pedesaan', null], ['Tempat pembuangan sampah', 7]]),
    ...facilities('Pemerintahan', [['Gedung kantor desa', 1], ['Gedung aula', 0], ['Gedung BPD', 1], ['Rumah jaga', 0], ['Komputer', 1]]).map(r => ({ ...r, condition: 'Kurang baik' })),
    ...facilities('Pemerintahan', [['Meja kerja', 6], ['Kursi kerja', 8], ['Meja rapat', 0], ['Kursi rapat', 75], ['Kursi tamu', 1], ['Lemari arsip', 1], ['Mesin tik', null], ['Rak buku', null]]).map((r, i) => ({ ...r, id: `inventaris-${i}`, condition: r.value === null ? '-' : 'Baik' }))
  ],
  finance: [
    ...([['Pendapatan Asli Desa', null], ['Pendapatan transfer', 633307300], ['Dana Desa', 259252000], ['Alokasi Dana Desa', 374055300], ['Bantuan keuangan', null], ['Pendapatan lain-lain', null]] as [string, number | null][]).map(([name, value], i) => ({ id: `income-${i}`, name, value, category: 'Pendapatan', note: 'Dokumen profil Desa Soulowe 2026' })),
    ...([['Penyelenggaraan Pemerintah Desa', 329945000], ['Pelaksanaan Pembangunan Desa', 364223660], ['Pembinaan Kemasyarakatan Desa', 37400000], ['Pemberdayaan Kemasyarakatan Desa', 188951600], ['Penanggulangan Bencana, Darurat dan Mendesak Desa', 113000000]] as [string, number][]).map(([name, value], i) => ({ id: `expense-${i}`, name, value, category: 'Belanja', note: 'Dokumen profil Desa Soulowe 2026' }))
  ],
  news,
  albums: [
    { id: 'album-1', name: 'Lanskap dan suasana desa', slug: 'lanskap-dan-suasana-desa', date: '2026-11-18', summary: 'Album contoh untuk meninjau tampilan dokumentasi. Foto ilustrasi, bukan dokumentasi Desa Soulowe.', photo: images.landscape, dummy: true, photos: [{ id: 'photo-1', url: images.landscape, alt: 'Ilustrasi lanskap pedesaan', dummy: true }, { id: 'photo-2', url: images.field, alt: 'Ilustrasi lahan pertanian', dummy: true }, { id: 'photo-6', url: images.seedlings, alt: 'Ilustrasi bibit tanaman di persemaian', dummy: true }] },
    { id: 'album-2', name: 'Pertanian dan keseharian', slug: 'pertanian-dan-keseharian', date: '2026-11-12', summary: 'Contoh album dengan foto ilustrasi pertanian untuk tahap pengembangan.', photo: images.field, dummy: true, photos: [{ id: 'photo-4', url: images.field, alt: 'Ilustrasi pertanian', dummy: true }, { id: 'photo-5', url: images.fields, alt: 'Ilustrasi hasil panen sayur di pasar', dummy: true }] }
  ]
};
