import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Menguji apakah akun uji (dibuat lewat insert SQL langsung) benar-benar bisa
// login ke Supabase Auth. Kalau tidak, masalahnya pada cara akun dibuat,
// bukan pada aplikasi.

const env = readFileSync('.env', 'utf8');
const url = env.match(/^PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
const key = env.match(/^PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.+)$/m)?.[1]?.trim();

const email = process.env.OPERATOR_EMAIL;
const password = process.env.OPERATOR_PASSWORD;

if (!email || !password) {
  console.error('OPERATOR_EMAIL dan OPERATOR_PASSWORD belum diisi.');
  process.exit(1);
}

// Langsung ke endpoint Auth, tanpa SDK, supaya error aslinya terlihat.
const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: key, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const text = await response.text();
console.log('status:', response.status);
console.log('body:', text.slice(0, 300));

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
console.log('SDK error:', error ? `${error.code} (${error.status})` : 'tidak ada');
console.log('SDK sesi:', data?.session ? 'ADA' : 'KOSONG');
