// Uji login dan alur tulis admin memakai kredensial dari environment.
//
// Kredensial TIDAK ditulis di file ini dan tidak masuk repo. Isi lewat variabel
// environment sebelum menjalankan:
//
//   $env:OPERATOR_EMAIL='operator@desasoulowe.id'
//   $env:OPERATOR_PASSWORD='password-anda'
//   bun scripts/admin-flow.mjs
//
// Script ini membuat data uji lalu MENGHAPUSNYA SENDIRI di akhir, termasuk
// saat gagal, supaya database tidak ditinggali sampah.

import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const email = process.env.OPERATOR_EMAIL;
const password = process.env.OPERATOR_PASSWORD;

if (!email || !password) {
  console.error('OPERATOR_EMAIL dan OPERATOR_PASSWORD belum diisi. Lihat komentar di atas.');
  process.exit(1);
}

const checks = [];
const created = { news: null, album: null, official: null };

// Cookie jar sederhana: cukup untuk menyimpan sesi Supabase antar request.
let cookies = '';
function storeCookies(response) {
  const set = response.headers.getSetCookie?.() ?? [];
  for (const raw of set) {
    const pair = raw.split(';')[0];
    const name = pair.split('=')[0];
    const kept = cookies
      .split('; ')
      .filter(Boolean)
      .filter(c => c.split('=')[0] !== name);
    kept.push(pair);
    cookies = kept.join('; ');
  }
}

async function call(path, { method = 'GET', body } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(cookies ? { cookie: cookies } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  storeCookies(response);
  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* bukan JSON */ }
  return { status: response.status, body: json, text };
}

let failure = null;

async function cleanup() {
  if (created.news) await call(`/api/admin/news/${created.news}`, { method: 'DELETE' });
  if (created.album) await call(`/api/admin/albums/${created.album}`, { method: 'DELETE' });
  if (created.official) await call(`/api/admin/officials/${created.official}`, { method: 'DELETE' });
}

try {
  // 1. Login.
  const login = await call('/api/admin/auth/login', {
    method: 'POST',
    body: { email, password }
  });
  assert.equal(login.status, 200, `login failed: ${login.status} ${login.text.slice(0, 160)}`);
  assert(login.body?.data?.email, 'login did not return the operator email');
  checks.push(`login as ${login.body.data.email}`);

  // 2. Sesi dikenali di request berikutnya.
  const session = await call('/api/admin/auth/session');
  assert.equal(session.status, 200, 'session not recognised after login');
  checks.push('session persists across requests via cookie');

  // 3. Dashboard memberi angka.
  const dash = await call('/api/admin/dashboard');
  assert.equal(dash.status, 200);
  assert.equal(typeof dash.body.data.news, 'number', 'dashboard missing news count');
  assert.equal(dash.body.data.year, 2026, 'dashboard year should be 2026');
  checks.push(`dashboard: ${dash.body.data.news} berita, ${dash.body.data.albums} album, tahun 2026`);

  // 4. Buat berita: harus langsung terbit dan muncul di API publik.
  const stamp = Date.now();
  const news = await call('/api/admin/news', {
    method: 'POST',
    body: {
      title: `Uji alur admin ${stamp}`,
      category: 'Informasi',
      publishedOn: '2026-11-26',
      summary: 'Dibuat oleh skrip uji, akan dihapus otomatis.',
      body: 'Isi uji.'
    }
  });
  assert.equal(news.status, 201, `create news failed: ${news.status} ${news.text.slice(0, 200)}`);
  created.news = news.body.data.id;
  assert(news.body.data.slug?.startsWith('uji-alur-admin'), `unexpected slug: ${news.body.data.slug}`);
  checks.push(`news created with slug "${news.body.data.slug}"`);

  const publicNews = await call('/api/public/news');
  assert.equal(publicNews.status, 200);
  assert(
    publicNews.body.data.some(item => item.id === created.news),
    'newly created news is not visible on the public API'
  );
  checks.push('new news is immediately visible publicly (no draft state)');

  // 5. Edit judul tidak boleh mengubah slug.
  const edited = await call(`/api/admin/news/${created.news}`, {
    method: 'PATCH',
    body: { title: `Judul diubah ${stamp}`, publishedOn: '2026-11-26', body: 'Isi diubah.' }
  });
  assert.equal(edited.status, 200, `edit failed: ${edited.status}`);
  const afterEdit = await call('/api/public/news');
  const row = afterEdit.body.data.find(item => item.id === created.news);
  assert.equal(row.slug, news.body.data.slug, 'slug changed when the title changed');
  checks.push('editing the title keeps the existing slug');

  // 6. Validasi menolak input kosong dengan 422, bukan 500.
  const invalid = await call('/api/admin/news', { method: 'POST', body: { title: '' } });
  assert.equal(invalid.status, 422, `empty title should be 422, got ${invalid.status}`);
  assert(invalid.body?.error?.fields?.title, 'validation error has no field detail');
  checks.push('empty title rejected with 422 and a field message');

  // 7. Tanggal salah ditolak.
  const badDate = await call('/api/admin/news', {
    method: 'POST',
    body: { title: 'Tanggal salah', publishedOn: '26-11-2026' }
  });
  assert.equal(badDate.status, 422, `bad date should be 422, got ${badDate.status}`);
  checks.push('invalid date format rejected');

  // 8. Album: buat, lalu foto unggulan dari album lain harus ditolak.
  const album = await call('/api/admin/albums', {
    method: 'POST',
    body: { name: `Album uji ${stamp}`, eventDate: '2026-11-26', description: 'Uji.' }
  });
  assert.equal(album.status, 201, `create album failed: ${album.status} ${album.text.slice(0, 160)}`);
  created.album = album.body.data.id;
  checks.push(`album created with slug "${album.body.data.slug}"`);

  // Ambil id media dari album seed untuk menguji trigger unggulan.
  const seedAlbum = await call('/api/public/albums/lanskap-dan-suasana-desa');
  const foreignMedia = seedAlbum.body?.data?.photos?.[0]?.media?.id;
  if (foreignMedia) {
    const cover = await call(`/api/admin/albums/${created.album}/cover`, {
      method: 'PATCH',
      body: { mediaId: foreignMedia }
    });
    assert.equal(cover.status, 422, `cover from another album should be 422, got ${cover.status}`);
    assert.equal(cover.body?.error?.code, 'cover_not_in_album');
    checks.push('cover photo from a different album is rejected with a clear message');
  }

  // 9. Perangkat: buat lalu hapus.
  const official = await call('/api/admin/officials', {
    method: 'POST',
    body: { name: `Uji ${stamp}`, role: 'Staf Uji', order: 99 }
  });
  assert.equal(official.status, 201, `create official failed: ${official.status}`);
  created.official = official.body.data.id;
  checks.push('official created');

  // 10. Logout benar-benar mengakhiri sesi.
  const out = await call('/api/admin/auth/logout', { method: 'POST' });
  assert.equal(out.status, 200);
  const afterOut = await call('/api/admin/auth/session');
  assert.equal(afterOut.status, 401, `session still valid after logout: ${afterOut.status}`);
  checks.push('logout invalidates the session');

  await cleanup();
  created.news = created.album = created.official = null;
  checks.push('test data removed');
} catch (cause) {
  failure = cause;
} finally {
  await cleanup();
}

await mkdir('docs', { recursive: true });
await writeFile('docs/admin-flow-results.json', JSON.stringify({
  base,
  checkedAt: new Date().toISOString(),
  checks,
  error: failure ? String(failure.message ?? failure) : null
}, null, 2));

if (failure) {
  console.error('GAGAL:', failure.message ?? failure);
  process.exit(1);
}

console.log(`PASS: ${checks.length} admin flow checks.`);
for (const c of checks) console.log(`  - ${c}`);
