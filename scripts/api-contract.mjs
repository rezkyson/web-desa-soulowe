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

  // API publik tidak boleh menerima tulisan. Dua lapisan bisa menolak:
  // 404/405 (tidak ada route tulis) atau 403 (route ada, RLS menolak).
  // Keduanya benar; yang salah adalah 200/201.
  const post = await fetch(base + '/api/public/news', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'uji', slug: 'uji', published_on: '2026-01-01' })
  });
  assert([403, 404, 405].includes(post.status), `POST to public API should be rejected, got ${post.status}`);
  assert(![200, 201].includes(post.status), 'public API accepted a write');

  // Pastikan penolakan itu benar-benar terjadi: tidak ada baris 'uji' tersimpan.
  const afterWrite = await get('/api/public/news');
  if (afterWrite.status === 200) {
    assert(
      !afterWrite.body.data.some(item => item.slug === 'uji'),
      'a write through the public API actually persisted'
    );
  }
  checks.push(`public API rejects writes (${post.status}) and nothing was stored`);
}

// Endpoint admin harus menolak tanpa sesi, dalam mode apa pun. Ini berlaku
// bahkan tanpa .env: yang diuji adalah tidak adanya akses, bukan isi data.
{
  // Endpoint yang WAJIB menolak tanpa sesi.
  const mustDeny = [
    ['GET', '/api/admin/auth/session'],
    ['GET', '/api/admin/dashboard'],
    ['POST', '/api/admin/officials'],
    ['DELETE', '/api/admin/officials/00000000-0000-0000-0000-000000000000'],
    ['POST', '/api/admin/news'],
    ['PATCH', '/api/admin/albums/00000000-0000-0000-0000-000000000000/cover'],
    ['POST', '/api/admin/finance']
  ];

  for (const [method, path] of mustDeny) {
    const response = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json' },
      body: method === 'GET' || method === 'DELETE' ? undefined : '{}'
    });

    // 401/403 = ditolak dengan benar. 503 = belum dikonfigurasi, juga tidak
    // membocorkan akses. Yang tidak boleh: 200 atau 201.
    assert(
      [401, 403, 503].includes(response.status),
      `${method} ${path} should be denied without a session, got ${response.status}`
    );
    assert(
      ![200, 201].includes(response.status),
      `${method} ${path} returned success without a session`
    );
  }
  checks.push(`${mustDeny.length} admin endpoints deny anonymous access`);

  // Logout tanpa sesi boleh berhasil: tidak ada yang bisa dibocorkan dan
  // hasilnya idempoten. Yang penting bukan 500 dan bukan 201.
  const logout = await fetch(base + '/api/admin/auth/logout', { method: 'POST' });
  assert([200, 401, 503].includes(logout.status), `logout without session returned ${logout.status}`);
  checks.push('logout without a session is harmless, not a server error');

  // Login dengan kredensial salah tidak boleh berhasil dan tidak boleh
  // membocorkan apakah email terdaftar.
  const badLogin = await fetch(base + '/api/admin/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'tidak-ada@contoh.id', password: 'salah-sekali' })
  });
  assert([401, 503].includes(badLogin.status), `bad login returned ${badLogin.status}`);
  if (badLogin.status === 401) {
    const body = await badLogin.json();
    assert.equal(body.error.code, 'invalid_credentials');
    assert(!/tidak terdaftar|not found|user not found/i.test(body.error.message), 'login leaks account existence');
  }
  checks.push('wrong credentials are rejected without leaking account existence');

  // Registrasi publik tidak boleh tersedia (PRD: satu akun operator saja).
  const signup = await fetch(base + '/api/admin/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'x@contoh.id', password: 'apapun123' })
  });
  assert([404, 405].includes(signup.status), `signup endpoint should not exist, got ${signup.status}`);
  checks.push('no public signup endpoint exists');
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
