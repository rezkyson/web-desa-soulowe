import type { Cookies } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import { fail } from '$lib/server/api';

/**
 * Penjaga untuk setiap endpoint admin.
 *
 * Mengembalikan Response bila akses harus ditolak, atau null bila boleh lanjut.
 * Tiga hasil yang dibedakan dengan sengaja:
 *   - 503 bila Supabase belum dikonfigurasi (bukan kesalahan pengguna)
 *   - 401 bila belum ada sesi
 *   - 403 bila ada sesi tetapi akun tidak terdaftar sebagai operator
 *
 * Pemeriksaan ini bukan satu-satunya penjaga: RLS di database juga menolak
 * tulisan dari akun yang tidak terdaftar (BE-10, BE-11).
 */
export async function requireOperator(cookies: Cookies): Promise<Response | null> {
  try {
    const supabase = createSupabaseServerClient(cookies);

    const { data: auth, error } = await supabase.auth.getUser();
    if (error || !auth.user) return fail(401, 'no_session', 'Anda belum masuk.');

    const { data: allowed, error: rpcError } = await supabase.rpc('is_operator');
    if (rpcError) {
      console.error('[api] pemeriksaan operator gagal', rpcError);
      return fail(500, 'internal_error', 'Tidak dapat memeriksa akses. Coba lagi.');
    }
    if (allowed !== true) {
      return fail(403, 'not_operator', 'Akun ini tidak memiliki akses operator.');
    }

    return null;
  } catch (cause) {
    // Konfigurasi belum lengkap bukan kesalahan server yang tak terduga.
    if (cause instanceof Error && /belum diisi/.test(cause.message)) {
      console.error('[api] konfigurasi Supabase belum lengkap');
      return fail(503, 'unavailable', 'Layanan belum dapat diakses. Coba lagi nanti.');
    }
    console.error('[api] requireOperator gagal', cause);
    return fail(500, 'internal_error', 'Terjadi kesalahan pada server. Coba lagi.');
  }
}
