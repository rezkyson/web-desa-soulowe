# Website Desa Soulowe

Implementasi **Fase 1 — frontend** berdasarkan `prd.md` dan dokumen kerja `TASK.md`. Belum ada Supabase, API Elysia, autentikasi nyata, Storage, atau deployment.

## Menjalankan lokal

```sh
bun install
bun run dev
```

- Website: http://127.0.0.1:5173/
- Demo admin: http://127.0.0.1:5173/admin/login
- Masukkan email contoh yang valid dan password contoh minimal 6 karakter. **Jangan pakai kredensial asli**. Tidak ada pemeriksaan akun di server pada fase ini.
- Sesi dan perubahan data hanya dalam memori client. Navigasi internal mempertahankan demo; reload mengembalikan data awal dan mengakhiri sesi demo. Ini bukan mekanisme keamanan.

```sh
bun run check
bun run build
bun run preview
```

## Smoke check frontend

```sh
bunx playwright install chromium
bun run test:smoke
bun run test:motion
```

Dev server harus berjalan pada port 5173. Override dengan environment `PREVIEW_URL` bila perlu. Script memeriksa alur mock, bukan testing backend/produksi. Screenshot disimpan pada `docs/screenshots/`; hasil pada `docs/smoke-results.json`.

Hasil Fase 1 dan keterbatasan lengkap ada pada `docs/phase-1-report.md`. Build juga telah diperiksa melalui preview port 4173. **Hentikan dev server sebelum menjalankan build/check production preview** agar artefak generated SvelteKit tidak berubah bersamaan.

Pemeriksaan motion meliputi hero satu kali, scroll reveal, fokus keyboard, navigasi publik, reduced-motion, dan fallback tanpa JavaScript. Screenshot revisi visual berada di `docs/screenshots/refinement/`.

Revisi kartu/border: `docs/border-refinement.md`. Jalankan `bun run test:borders` pada preview port 4173 (atau gunakan `PREVIEW_URL`). Komponen referensi 21st.dev diadaptasi ke Svelte pada `src/lib/components/ui/AnimatedBorder.svelte`, tanpa React/Tailwind/shadcn atau dependency baru.

## Struktur

- `src/routes/(public)/`: halaman publik, section dan detail.
- `src/routes/admin/`: login demo, dashboard, modul admin.
- `src/lib/components/`: komponen presentasi dan editor mock.
- `src/lib/content/desa.ts`: konten tetap tanpa CRUD.
- `src/lib/mock/`: seed dan store memory-only.
- `src/lib/types.ts`: tipe frontend dan rancangan respons.
- `docs/frontend-contract.md`: rancangan kontrak backend.
- `docs/source-notes.md`: perbedaan sumber dan daftar dummy.
- `docs/reference/`: gambar referensi visual dari klien.

`DESIGN.md` dan `TASK.md` adalah dokumen kerja internal dan sengaja tidak masuk repositori (lihat `.gitignore`).

## Pembatasan rilis

Jangan publikasikan prototype sebagai aplikasi produksi. Nomor WhatsApp, berita/album, sambutan, dan media masih contoh. Peta kantor telah aktif berdasarkan tautan koreksi pengguna; pemeriksaan peta dapat diulang dengan `bun run test:map` (default preview port 4173). Sitemap masih kerangka dan domain belum ditentukan. Fase backend hanya dimulai setelah persetujuan pengguna terhadap hasil frontend.
