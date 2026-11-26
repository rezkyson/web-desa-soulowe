import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Cookies } from '@sveltejs/kit';

/**
 * Klien Supabase untuk konteks request pengguna.
 *
 * Memakai anon/publishable key, bukan service role. Semua akses tetap tunduk
 * pada RLS, sehingga request anonim hanya bisa membaca konten publik dan
 * request operator bisa menulis. Service role sengaja tidak dipakai di jalur
 * ini (BE-12): memakainya akan melewati RLS dan membuat pemeriksaan operator
 * di API menjadi satu-satunya penjaga.
 */
export function createSupabaseServerClient(cookies: Cookies) {
  const url = publicEnv.PUBLIC_SUPABASE_URL;
  const key = publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      'PUBLIC_SUPABASE_URL dan PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diisi. ' +
      'Salin .env.example menjadi .env lalu isi nilainya.'
    );
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookies.getAll();
      },
      setAll(items) {
        // Diagnostik sementara: mencatat nama cookie, bukan nilainya.
        console.log('[auth-debug] setAll:', items.map(i => i.name).join(', ') || '(kosong)');
        for (const { name, value, options } of items) {
          cookies.set(name, value, { ...options, path: options?.path ?? '/' });
        }
      }
    }
  });
}

/**
 * Klien dengan hak penuh, melewati RLS. Hanya untuk tugas tanpa pengguna:
 * migrasi media lama, pembersihan, atau verifikasi internal. Jangan pernah
 * memakainya untuk melayani request pengguna (BE-12).
 */
export function createSupabaseAdminClient() {
  const url = publicEnv.PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY belum diisi.');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

/**
 * Operator yang sedang login, atau null. Memeriksa dua hal: ada sesi valid,
 * dan user tersebut terdaftar di admin_users. Sesi saja tidak cukup (BE-10).
 */
export async function getOperator(cookies: Cookies) {
  const supabase = createSupabaseServerClient(cookies);
  const { data: auth, error } = await supabase.auth.getUser();

  if (error || !auth.user) return null;

  // admin_users tidak punya policy baca untuk klien, jadi tabel itu tidak bisa
  // di-query dari sini. Keanggotaan diperiksa lewat is_operator(), yang
  // berjalan security definer dan hanya mengembalikan boolean.
  const { data: allowed, error: rpcError } = await supabase.rpc('is_operator');
  if (rpcError || allowed !== true) return null;

  return { id: auth.user.id, email: auth.user.email ?? '' };
}
