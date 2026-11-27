import { readFileSync } from 'node:fs';

// BE-26, lapis pertama: akses anonim lewat REST Supabase sungguhan.
//
// Yang diuji bukan endpoint aplikasi, melainkan database itu sendiri. Endpoint
// aplikasi bisa saja menolak lebih dulu karena kode, sehingga RLS tidak pernah
// dievaluasi. Di sini tidak ada kode aplikasi sama sekali: hanya kunci
// publishable, seperti yang dipegang peramban.
//
// Yang diharapkan:
//   baca konten  -> berhasil
//   tulis konten -> ditolak
//   admin_users  -> ditolak (tidak ada GRANT maupun policy)
//   tulis media  -> ditolak
//   is_operator  -> false, bukan error

const env = readFileSync('.env', 'utf8');
const url = env.match(/^PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
const key = env.match(/^PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.+)$/m)?.[1]?.trim();

if (!url || !key) {
  console.error('PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_PUBLISHABLE_KEY tidak ada di .env');
  process.exit(1);
}

const results = [];

async function rest(path, init = {}) {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    }
  });
  const text = await response.text();
  return { status: response.status, text: text.slice(0, 200) };
}

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  (${detail})`);
}

// 1. Anonim harus bisa membaca konten publik.
const read = await rest('news?select=id&limit=1');
record('anon baca berita', read.status === 200, `status ${read.status}`);

const stats = await rest('statistics?select=id&limit=1');
record('anon baca statistik', stats.status === 200, `status ${stats.status}`);

// 2. Anonim tidak boleh menulis. GRANT tidak diberikan, jadi ini ditolak
//    sebelum policy dievaluasi. Status 401/403 sama-sama benar.
const insert = await rest('news', {
  method: 'POST',
  headers: { Prefer: 'return=representation' },
  body: JSON.stringify({ title: 'uji rls anon', slug: 'uji-rls-anon', published_on: '2026-01-01' })
});
record('anon tolak tulis berita', insert.status === 401 || insert.status === 403, `status ${insert.status}`);

const update = await rest('news?slug=eq.uji-rls-anon', {
  method: 'PATCH',
  body: JSON.stringify({ title: 'diubah anon' })
});
record('anon tolak ubah berita', update.status === 401 || update.status === 403, `status ${update.status}`);

const del = await rest('news?slug=eq.uji-rls-anon', { method: 'DELETE' });
record('anon tolak hapus berita', del.status === 401 || del.status === 403, `status ${del.status}`);

// 3. Daftar operator tidak boleh terbaca klien.
const adminUsers = await rest('admin_users?select=user_id&limit=1');
record(
  'anon tidak bisa baca admin_users',
  adminUsers.status === 401 || adminUsers.status === 403 || adminUsers.status === 404,
  `status ${adminUsers.status}`
);

// 4. Storage memakai API sendiri (/storage/v1), bukan PostgREST. Menguji lewat
//    /rest/v1/storage/objects hanya menghasilkan 404 dan tidak membuktikan apa pun.
//    Anonim boleh membaca objek, tidak boleh mengunggah.
const listResponse = await fetch(`${url}/storage/v1/object/list/media`, {
  method: 'POST',
  headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ prefix: '', limit: 1 })
});
record(
  'anon baca daftar media',
  listResponse.status === 200,
  `status ${listResponse.status}`
);

const uploadBody = new FormData();
uploadBody.append('file', new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' }), 'rls-anon.png');
const uploadResponse = await fetch(`${url}/storage/v1/object/media/uji/rls-anon.png`, {
  method: 'POST',
  headers: { apikey: key, Authorization: `Bearer ${key}` },
  body: uploadBody
});
record(
  'anon tolak unggah media',
  uploadResponse.status === 400 || uploadResponse.status === 401 || uploadResponse.status === 403,
  `status ${uploadResponse.status}`
);

// 5. is_operator harus false untuk anon, bukan error.
const rpc = await fetch(`${url}/rest/v1/rpc/is_operator`, {
  method: 'POST',
  headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: '{}'
});
const rpcText = await rpc.text();
record('anon is_operator false', rpc.status === 200 && rpcText.trim() === 'false', `${rpc.status} ${rpcText.slice(0, 20)}`);

const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} pemeriksaan anonim lulus.`);
if (failed.length) {
  console.log('Yang gagal:');
  for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
  process.exit(1);
}
