import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';

// Menghapus sisa data uji dari scripts/admin-flow.mjs.
//
// Kenapa perlu: versi lama skrip itu melakukan logout sebelum cleanup, sehingga
// penghapusan berjalan tanpa sesi dan ditolak 401. Kegagalannya tidak dicek,
// jadi skrip tetap melaporkan "test data removed" padahal barisnya tertinggal.
//
// Kredensial ditanyakan langsung di sini, bukan lewat variabel environment.
// Alasannya: variabel dari jendela cmd lain tidak ikut terbawa, dan "set /p"
// mudah salah sehingga skrip berhenti diam-diam tanpa pesan apa pun.

const env = readFileSync('.env', 'utf8');
const url = env.match(/^PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
const key = env.match(/^PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.+)$/m)?.[1]?.trim();

function clean(value) {
  if (!value) return '';
  return value.trim().replace(/^["']|["']$/g, '').trim();
}

if (!url || !key) {
  console.error('PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_PUBLISHABLE_KEY tidak ada di .env');
  process.exit(1);
}

// Urutan sumber kredensial: variabel environment kalau ada, kalau tidak
// ditanyakan. Dengan begitu skrip bisa dipakai interaktif maupun otomatis.
let email = clean(process.env.OPERATOR_EMAIL);
let password = clean(process.env.OPERATOR_PASSWORD);

if (!email || !password) {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    if (!email) email = clean(await terminal.question('Email operator: '));
    if (!password) password = clean(await terminal.question('Password operator: '));
  } finally {
    terminal.close();
  }
}

if (!email || !password) {
  console.error('Email atau password kosong. Dibatalkan.');
  process.exit(1);
}

console.log(`\nMasuk sebagai ${email}…`);

// Login langsung ke Supabase Auth untuk mendapat token akses.
const auth = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: key, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

if (!auth.ok) {
  const detail = await auth.text();
  console.error(`Login gagal (${auth.status}): ${detail.slice(0, 200)}`);
  console.error('Periksa email dan password. Kalau memakai cmd, jalankan skrip ini');
  console.error('langsung dan ketik saat diminta, jangan lewat "set /p".');
  process.exit(1);
}

const session = await auth.json();
const token = session.access_token;
const headers = {
  apikey: key,
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
};

// Pola penanda uji yang dibuat admin-flow.mjs.
const patterns = [
  { table: 'news', column: 'slug', match: 'uji-alur-admin', label: 'berita uji' },
  { table: 'gallery_albums', column: 'slug', match: 'album-uji', label: 'album uji' },
  { table: 'village_officials', column: 'name', match: 'Uji ', label: 'perangkat uji' }
];

let removed = 0;

for (const { table, column, match, label } of patterns) {
  const list = await fetch(
    `${url}/rest/v1/${table}?select=id,${column}&${column}=like.${encodeURIComponent(match + '*')}`,
    { headers }
  );

  if (!list.ok) {
    console.log(`${label}: gagal membaca (${list.status}) ${(await list.text()).slice(0, 120)}`);
    continue;
  }

  const rows = await list.json();
  if (!rows.length) {
    console.log(`${label}: tidak ada sisa`);
    continue;
  }

  for (const row of rows) {
    const del = await fetch(`${url}/rest/v1/${table}?id=eq.${row.id}`, {
      method: 'DELETE',
      headers
    });
    if (del.ok) {
      removed++;
      console.log(`${label}: dihapus "${row[column]}"`);
    } else {
      console.log(`${label}: GAGAL menghapus "${row[column]}" (${del.status}) ${(await del.text()).slice(0, 120)}`);
    }
  }
}

console.log(`\n${removed} baris sisa dihapus.`);
