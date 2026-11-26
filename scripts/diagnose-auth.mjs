import { readFileSync } from 'node:fs';
import { createServerClient } from '@supabase/ssr';

// Diagnostik tanpa kredensial: memastikan dua hal yang bisa gagal diam-diam.
//   1. Apakah @supabase/ssr menghasilkan cookie sesi saat sign-in.
//   2. Apakah fungsi is_operator bisa dipanggil dengan kunci publishable.
//
// Untuk nomor 1 dipakai kredensial sengaja salah: yang dilihat bukan hasil
// login, melainkan apakah klien berhasil menghubungi Auth sama sekali dan
// apakah error yang muncul sesuai (invalid_credentials), bukan error lain.

const env = readFileSync('.env', 'utf8');
const url = env.match(/^PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
const key = env.match(/^PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.+)$/m)?.[1]?.trim();

const jar = new Map();
const supabase = createServerClient(url, key, {
  cookies: {
    getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
    setAll: items => {
      for (const { name, value } of items) jar.set(name, value);
    }
  }
});

// 1. Panggilan Auth dasar.
const { error } = await supabase.auth.signInWithPassword({
  email: 'tidak-ada-xyz@contoh.id',
  password: 'salah12345'
});
console.log('sign-in salah ->', error ? `${error.code} (${error.status})` : 'TIDAK ADA ERROR, mencurigakan');

// 2. is_operator sebagai anon (tanpa sesi). Harus false, bukan error.
const { data: anonAllowed, error: anonError } = await supabase.rpc('is_operator');
console.log('is_operator (anon) ->', anonAllowed, anonError ? `ERROR: ${anonError.message}` : '');

// 3. getUser tanpa sesi. Harus null tanpa melempar.
const { data: userData, error: userError } = await supabase.auth.getUser();
console.log('getUser tanpa sesi ->', userData?.user?.email ?? 'null', userError ? `(${userError.message})` : '');

// 4. Apakah kunci ini benar-benar tipe publishable baru.
console.log('tipe kunci:', key.startsWith('sb_publishable_') ? 'publishable baru' : key.startsWith('eyJ') ? 'JWT anon lama' : 'tidak dikenal');
