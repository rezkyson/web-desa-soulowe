import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';

// Melacak bug "login berhasil tetapi sesi tidak dikenali".
//
// Menguji jalur HTTP sungguhan: login, lalu pakai cookie sesi untuk request
// berikutnya. Ini memisahkan dua kemungkinan yang mirip gejalanya:
//   A. Supabase tidak menghasilkan sesi -> masalah kredensial/akun
//   B. Sesi ada tetapi cookie tidak terbawa -> masalah aplikasi
//
// Kredensial dibaca dari environment, tidak disimpan di file.

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const email = process.env.OPERATOR_EMAIL;
const password = process.env.OPERATOR_PASSWORD;

if (!email || !password) {
  console.error('OPERATOR_EMAIL dan OPERATOR_PASSWORD belum diisi.');
  process.exit(1);
}

const steps = [];
let jar = '';

function storeCookies(response) {
  const set = response.headers.getSetCookie?.() ?? [];
  for (const raw of set) {
    const pair = raw.split(';')[0];
    const name = pair.split('=')[0];
    jar = jar.split('; ').filter(Boolean).filter(c => c.split('=')[0] !== name).concat(pair).join('; ');
  }
  return set;
}

async function call(path, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(jar ? { cookie: jar } : {}),
      ...(options.headers ?? {})
    }
  });
  const setCookies = storeCookies(response);
  const text = await response.text();
  let body = null;
  try { body = JSON.parse(text); } catch { /* bukan JSON */ }
  return { status: response.status, body, text, setCookies };
}

const results = {};

// 1. Login.
const login = await call('/api/admin/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
results.login = { status: login.status, code: login.body?.error?.code ?? null };
steps.push(`login: ${login.status}${login.body?.error ? ` (${login.body.error.code})` : ''}`);

// Kunci diagnosis: apakah respons login mengirim Set-Cookie?
results.cookiesWritten = login.setCookies.map(c => c.split('=')[0]);
steps.push(`Set-Cookie dari login: ${results.cookiesWritten.length ? results.cookiesWritten.join(', ') : 'TIDAK ADA'}`);

if (login.status === 200) {
  // 2. Sesi harus dikenali pada request berikutnya.
  const session = await call('/api/admin/auth/session');
  results.session = session.status;
  steps.push(`session setelah login: ${session.status}`);

  // 3. Endpoint admin lain juga harus lolos.
  const dash = await call('/api/admin/dashboard');
  results.dashboard = dash.status;
  steps.push(`dashboard: ${dash.status}`);

  // 4. Logout lalu sesi harus hilang.
  const out = await call('/api/admin/auth/logout', { method: 'POST' });
  const after = await call('/api/admin/auth/session');
  results.logout = out.status;
  results.sessionAfterLogout = after.status;
  steps.push(`logout: ${out.status}, sesi setelah logout: ${after.status}`);
}

await mkdir('docs', { recursive: true });
await writeFile('docs/session-diagnosis.json', JSON.stringify({
  base, checkedAt: new Date().toISOString(), steps, results
}, null, 2));

console.log(steps.join('\n'));

// Kesimpulan otomatis, supaya tidak perlu menebak dari angka.
if (login.status !== 200) {
  console.log('\nKESIMPULAN: login gagal. Periksa kredensial dan pendaftaran di admin_users.');
} else if (results.cookiesWritten.length === 0) {
  console.log('\nKESIMPULAN: Supabase menerima login tetapi TIDAK ada cookie sesi yang dikirim.');
  console.log('Berarti sesi gagal dibuat atau gagal ditulis ke cookie.');
} else if (results.session === 200) {
  console.log('\nKESIMPULAN: sesi bekerja dengan benar lewat HTTP. Bug tidak tereproduksi.');
} else {
  console.log('\nKESIMPULAN: cookie dikirim tetapi sesi tidak dikenali pada request berikutnya.');
  console.log('Berarti cookie tidak terbaca kembali (nama/path/atribut tidak cocok).');
}
