# Revisi kartu dan border

Tanggal: 22 November 2026. Tetap **Fase 1 frontend**, tanpa izin backend.

## Implementasi

Referensi pengguna adalah komponen React `AnimatedBorder` dari 21st.dev. Project ini SvelteKit + TypeScript dan CSS biasa, bukan React/shadcn/Tailwind. Referensi diadaptasi secara native, tidak disalin sebagai TSX yang tidak bisa dijalankan dan tidak memasang framework baru.

- Komponen UI: `src/lib/components/ui/AnimatedBorder.svelte`.
- Observer bersama: `src/lib/actions/borderVisibility.ts`.
- Kartu berita: `src/lib/components/NewsCard.svelte`.
- Styling kartu dan edge: `src/cards.css`.

Folder native komponen reusable adalah `src/lib/components/ui`, diimpor dengan `$lib/components/ui`. Tidak perlu membuat `/components/ui` di root atau mengubah alias menjadi `@/`: itu konvensi React yang tidak dibutuhkan SvelteKit.

## Perilaku

- Border berita: 1px, hijau redup, sorotan conic berputar 8 detik per putaran. Konten tetap diam; hanya layer border berotasi.
- Berita 3 kolom desktop, 2 tablet, 1 mobile. Foto berasio tetap, judul dan ringkasan masing-masing 2 baris maksimum; tautan judul dan “Baca berita” membuka isi lengkap. Footer sejajar per baris.
- Galeri memakai foto proporsional dan border statis, tanpa stretch tinggi antaralbum. Border statis juga diterapkan pada panel sejarah, sambutan, direktori perangkat/BPD, statistik, dan blok layanan.
- IntersectionObserver menghentikan animasi di luar layar, visibilitychange menghentikannya saat tab tidak aktif, reduced-motion mengubahnya menjadi statis. SSR tanpa JS tetap terbaca dengan border biasa.
- Tidak ada dependensi baru, gambar baru, canvas, timer animasi, atau JavaScript per-frame. Observer dipakai bersama dan dibersihkan saat tidak terpakai. Tidak mengklaim pengukuran baterai/FPS atau Lighthouse yang belum dijalankan.
- File CSS global hasil build sekitar 69,43 kB raw / 17,04 kB gzip (sebelumnya 66,24 / 16,30 kB sebelum revisi ini). Kenaikan CSS gzip sekitar 0,74 kB; ini bukan ukuran total aplikasi atau total biaya runtime.

## Cara memakai komponen

```svelte
<script lang="ts">
  import AnimatedBorder from '$lib/components/ui/AnimatedBorder.svelte';
</script>

<AnimatedBorder duration={8} color="#6f9263" width={1}>
  <div style="padding:24px">Konten</div>
</AnimatedBorder>
```

Radius 12px default; permukaan mengikuti tepi. `contentClassName` mengatur kelas konten bagian dalam. Jangan membungkus semua blok dengan efek ini: penggunaan saat ini dibatasi pada kartu berita.

## Verifikasi

- `bun run check`: 0 error, 0 warning.
- Production build: berhasil; tidak mengonfigurasi deployment pada revisi ini.
- `bun run test:borders`: 9 kelompok pemeriksaan lulus pada production preview (offscreen pause, efek conic/rotasi, proporsi/tinggi pada 390/768/1440px, keyboard link, filter/remount, live reduced-motion, dan SSR tanpa JS).
- `bun run test:motion`: 7 kelompok pemeriksaan lulus setelah penyesuaian screenshot untuk tidak memanggil `.finish()` pada animasi infinite, serta menunggu transisi mendekati nol milik Leaflet selesai.
- Bukti visual: `docs/screenshots/borders/`. Screenshot desktop/mobile berita dan galeri ditinjau setelah render; ruang kosong galeri yang ditemukan sudah diperbaiki.
- Detector file revisi: `docs/impeccable-borders.json` berisi `[]`. Bukan jaminan kualitas estetika atau pengganti review pengguna.
- Hasil lengkap fungsi frontend tersedia pada `docs/smoke-results.json`; pemeriksaan browser lain dan audit menyeluruh tetap Fase 4.

Tautan preview: http://127.0.0.1:4173/ dan http://127.0.0.1:4173/berita. Refresh bila browser masih memuat versi lama. Foto/konten berita masih dummy; backend belum dimulai.
