import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

// Menjaga dokumentasi tetap sesuai kode.
//
// Dokumentasi backend mudah menjadi bohong tanpa terasa: satu endpoint
// ditambahkan, satu nama field diganti, dan tabel di dokumen tidak lagi cocok.
// Pemeriksaan ini membandingkan daftar endpoint di kode dengan yang tertulis di
// docs/api-endpoints.md, lalu memastikan setiap path yang didokumentasikan
// benar-benar ada.
//
// Yang tidak diperiksa: apakah penjelasan prosa masih akurat. Itu tetap tugas
// manusia. Yang dijaga di sini adalah hal yang paling mudah basi.

const sources = [
  { file: 'src/lib/server/api-public.ts', prefix: '/api/public' },
  { file: 'src/lib/server/api-auth.ts', prefix: '/api/admin/auth' },
  { file: 'src/lib/server/api-content.ts', prefix: '/api/admin' },
  { file: 'src/lib/server/api-media.ts', prefix: '/api/admin' },
  { file: 'src/lib/server/api-upload.ts', prefix: '/api/admin/media' }
];

const inCode = new Set();
for (const { file, prefix } of sources) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/\.(get|post|patch|put|delete)\('([^']*)'/g)) {
    // 'file', 'folder', dan 'alt' di api-upload bukan route: itu nama field
    // form. Hanya path yang diawali '/' yang merupakan route.
    if (!m[2].startsWith('/')) continue;
    inCode.add(`${m[1].toUpperCase()} ${prefix}${m[2]}`);
  }
}

const docs = readFileSync('docs/api-endpoints.md', 'utf8');

// Path di dokumen ditulis dalam tabel markdown: | GET | `/api/public/news` |
// Sebagian tabel memakai path relatif di bawah prefix admin, jadi awalan
// bagian dilacak; kalau tidak dinyatakan ulang, dianggap /api/admin karena
// hanya bagian itu yang memakai path relatif.
const inDocs = new Set();
let sectionPrefix = '/api/admin';
for (const line of docs.split(/\r?\n/)) {
  const prefixLine = line.match(/^Prefix\s+`([^`]+)`/);
  if (prefixLine) {
    sectionPrefix = prefixLine[1];
    continue;
  }

  const row = line.match(/\|\s*(GET|POST|PATCH|PUT|DELETE)\s*\|\s*`([^`]+)`\s*\|/);
  if (!row) continue;

  const [, method, rawPath] = row;
  const full = rawPath.startsWith('/api/') ? rawPath : `${sectionPrefix}${rawPath}`;
  inDocs.add(`${method} ${full}`);
}

assert(inCode.size > 0, 'tidak ada endpoint terbaca dari kode');
assert(inDocs.size > 0, 'tidak ada endpoint terbaca dari dokumentasi');

const missing = [...inCode].filter(e => !inDocs.has(e));
const phantom = [...inDocs].filter(e => !inCode.has(e));

assert.deepEqual(missing, [], `endpoint ada di kode tetapi tidak didokumentasikan:\n  ${missing.join('\n  ')}`);
assert.deepEqual(phantom, [], `dokumentasi menyebut endpoint yang tidak ada di kode:\n  ${phantom.join('\n  ')}`);

// Aturan PRD yang tidak boleh hilang dari dokumen, karena mudah terlewat saat
// dokumen disunting.
const requiredNotes = [
  ['null berbeda dari 0', /`value: null` berarti angka tidak tersedia|null berarti tidak tersedia/],
  ['tanpa total turunan', /tidak ada perhitungan\s+total, surplus, atau defisit/i],
  ['magic bytes', /magic bytes/i],
  ['5 MB', /5 MB/],
  ['service role tidak dipakai', /Service role key \*\*tidak dipakai\*\*|tidak dipakai\*\* untuk melayani/],
  ['slug tidak berubah saat edit', /tidak berubah\*\* saat judul/]
];
for (const [label, pattern] of requiredNotes) {
  assert(pattern.test(docs), `dokumentasi kehilangan catatan penting: ${label}`);
}

console.log(`PASS: dokumentasi cocok dengan kode (${inCode.size} endpoint).`);
console.log(`  - ${inCode.size} endpoint di kode, semuanya terdokumentasi`);
console.log('  - tidak ada endpoint hantu di dokumentasi');
console.log(`  - ${requiredNotes.length} catatan aturan PRD masih ada`);
