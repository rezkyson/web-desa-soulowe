import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';

// Kontrak API publik, diuji lewat HTTP terhadap preview yang berjalan.
//
// Tes ini punya dua mode:
//   * Tanpa .env: memastikan API gagal dengan jujur (503), bukan pura-pura
//     sukses atau mengembalikan data mock. Ini tetap pemeriksaan nyata.
//   * Dengan .env: memeriksa bentuk respons, status kode, dan aturan data.
//
// Jalankan: bun scripts/api-contract.mjs
// Prasyarat: preview berjalan pada PREVIEW_URL (default 4173).

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const checks = [];
const errors = [];

// Deteksi konfigurasi dari file .env, bukan dari server, supaya kedua mode bisa
// diuji tanpa menambah endpoint debug.
let configured = false;
if (existsSync('.env')) {
  const env = readFileSync('.env', 'utf8');
  const url = /^PUBLIC_SUPABASE_URL=(.+)$/m.exec(env)?.[1]?.trim();
  const key = /^PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.+)$/m.exec(env)?.[1]?.trim();
  configured = Boolean(url && key && !url.includes('PROJECT-REF') && key.length > 20);
}

async function get(path) {
  const response = await fetch(base + path, { headers: { accept: 'application/json' } });
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    errors.push(`${path} did not return JSON: ${text.slice(0, 80)}`);
  }
  return { status: response.status, body, type: response.headers.get('content-type') ?? '' };
}

const routes = [
  '/api/public/settings', '/api/public/principal', '/api/public/officials',
  '/api/public/bpd', '/api/public/statistics', '/api/public/facilities',
  '/api/public/finance', '/api/public/contact', '/api/public/news',
  '/api/public/albums'
];

if (!configured) {
  // Mode belum terkonfigurasi: setiap endpoint harus menolak dengan jelas.
  for (const path of routes) {
    const response = await get(path);
    assert.equal(response.status, 503, `${path} should be 503 without Supabase config, got ${response.status}`);
    assert.equal(response.body?.data, null, `${path} must not return data without config`);
    assert.equal(response.body?.error?.code, 'unavailable', `${path} error code should be unavailable`);
    // Pesan tidak boleh membocorkan nama variabel environment.
    assert(
      !/SUPABASE|\.env|PROJECT-REF/.test(response.body?.error?.message ?? ''),
      `${path} leaks configuration detail: ${response.body?.error?.message}`
    );
  }
  checks.push(`${routes.length} endpoints fail with 503 and no leaked config, as expected without .env`);

  const detail = await get('/api/public/news/tidak-ada');
  assert.equal(detail.status, 503, 'detail route should also be 503 without config');
  checks.push('detail route also fails honestly');
} else {
  // Mode terkonfigurasi: kontrak sebenarnya.
  const shape = (value, name) => {
    assert(value && typeof value === 'object', `${name} is not an object`);
    assert('data' in value && 'error' in value, `${name} does not follow the Result shape`);
  };

  for (const path of routes) {
    const response = await get(path);
    assert([200, 404].includes(response.status), `${path} returned ${response.status}: ${JSON.stringify(response.body).slice(0, 200)}`);
    assert.match(response.type, /application\/json/, `${path} is not JSON`);
    shape(response.body, path);
    if (response.status === 200) {
      assert.equal(response.body.error, null, `${path} returned data with an error`);
    }
  }
  checks.push(`${routes.length} public endpoints respond with the documented Result shape`);

  const news = await get('/api/public/news');
  assert.equal(news.status, 200);
  assert(Array.isArray(news.body.data), 'news list is not an array');
  for (const item of news.body.data) {
    for (const field of ['id', 'title', 'slug', 'published_on']) {
      assert(item[field] !== undefined, `news item missing ${field}`);
    }
  }
  checks.push(`news list returns ${news.body.data.length} items with required fields`);

  const stats = await get('/api/public/statistics');
  assert.equal(stats.status, 200);
  for (const row of stats.body.data) {
    assert.equal(row.year, 2026, `statistics row is not 2026: ${row.year}`);
    assert(['jiwa', 'KK', 'RTM', 'orang', 'unit', 'km'].includes(row.unit), `unexpected unit ${row.unit}`);
  }
  checks.push('statistics only return 2026 rows with allowed units');

  const finance = await get('/api/public/finance');
  assert.equal(finance.status, 200);
  assert(!('total' in finance.body) && !('surplus' in finance.body), 'finance response must not contain derived totals');
  for (const row of finance.body.data) {
    assert(['Pendapatan', 'Belanja'].includes(row.category), `unexpected finance category ${row.category}`);
  }
  checks.push('finance has no derived totals, categories are Pendapatan/Belanja');

  const missing = await get('/api/public/news/slug-yang-tidak-ada');
  assert.equal(missing.status, 404, 'missing news should be 404');
  assert.equal(missing.body.error.code, 'not_found');
  checks.push('missing news returns 404 not_found');

  const album = await get('/api/public/albums/lanskap-dan-suasana-desa');
  if (album.status === 200) {
    const photos = album.body.data.photos ?? [];
    assert(photos.length > 0, 'album has no photos');
    const featured = photos.filter(p => p.featured);
    assert(featured.length <= 1, 'more than one featured photo');
    checks.push(`album detail returns ${photos.length} photos, ${featured.length} featured`);
  }

  // API publik tidak boleh menerima tulisan.
  const post = await fetch(base + '/api/public/news', { method: 'POST', body: '{}' });
  assert([404, 405].includes(post.status), `POST to public API should be rejected, got ${post.status}`);
  checks.push('public API rejects writes');
}

await mkdir('docs', { recursive: true });
await writeFile('docs/api-contract-results.json', JSON.stringify({
  base,
  checkedAt: new Date().toISOString(),
  mode: configured ? 'configured' : 'unconfigured',
  checks,
  errors
}, null, 2));

assert.deepEqual(errors, []);
console.log(`PASS: ${checks.length} API contract checks (${configured ? 'configured' : 'unconfigured'} mode).`);
for (const c of checks) console.log(`  - ${c}`);
