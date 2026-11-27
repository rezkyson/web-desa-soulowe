import { readFileSync } from 'node:fs';

// Memastikan setiap gambar yang ditampilkan halaman benar-benar ada.
// URL yang 404 akan tampil sebagai kotak rusak di browser, dan itu tidak
// terlihat dari status halaman. Diperiksa satu per satu.

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const pages = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/', '/pemerintahan', '/berita', '/galeri', '/galeri/lanskap-dan-suasana-desa'];

const env = readFileSync('.env', 'utf8');
const supabase = env.match(/^PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();

let checked = 0;
let broken = 0;

for (const path of pages) {
  const response = await fetch(base + path);
  const html = await response.text();
  const srcs = [...new Set([...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]))];

  console.log(`\n${path} (${response.status}) — ${srcs.length} gambar unik`);
  for (const src of srcs) {
    const url = src.startsWith('http') ? src : base + src;
    const head = await fetch(url, { method: 'GET' });
    checked++;
    if (!head.ok) {
      broken++;
      const hint = supabase && url.startsWith(supabase) ? ' (Storage: file belum diunggah)' : '';
      console.log(`  GAGAL ${head.status} ${src}${hint}`);
    }
  }
}

console.log(`\n${checked} gambar diperiksa, ${broken} gagal.`);
if (broken) process.exit(1);
