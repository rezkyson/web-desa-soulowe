import { readFileSync } from 'node:fs';

// Memastikan uji RLS tidak meninggalkan apa pun di Storage.
// Skrip rls-roles.sql mencoba menulis objek "uji/..." lalu membatalkannya.
// Kalau ada yang lolos, harus terlihat dan dihapus.

const env = readFileSync('.env', 'utf8');
const url = env.match(/^PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
const key = env.match(/^PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.+)$/m)?.[1]?.trim();

const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

async function list(prefix) {
  const response = await fetch(`${url}/storage/v1/object/list/media`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prefix, limit: 100 })
  });
  const data = await response.json();
  return Array.isArray(data) ? data.map(item => item.name) : [`ERROR: ${JSON.stringify(data)}`];
}

const root = await list('');
const uji = await list('uji');

console.log('isi bucket media:', root.join(', ') || '(kosong)');
console.log('folder uji/   :', uji.join(', ') || '(tidak ada)');

const leftovers = [...root, ...uji].filter(name => /uji|rls|test/i.test(name));
if (leftovers.length) {
  console.log('\nADA SISA UJI:', leftovers.join(', '));
  process.exit(1);
}
console.log('\nBersih: tidak ada sisa uji di Storage.');
