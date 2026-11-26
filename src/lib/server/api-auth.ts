import { Elysia, t } from 'elysia';
import { createSupabaseServerClient } from '$lib/server/supabase';
import { ok, fail, serverError, readJson, text } from '$lib/server/api';
import type { Cookies } from '@sveltejs/kit';

/**
 * API admin: login, logout, ganti password.
 *
 * Tidak ada endpoint registrasi, sesuai PRD (satu akun operator yang dibuat
 * secara terkontrol lewat dashboard Supabase).
 */
export function authApi(cookies: Cookies) {
  const db = () => createSupabaseServerClient(cookies);

  return new Elysia({ prefix: '/api/admin/auth' })
    .post('/login', async ({ request }) => {
      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const email = text(body.email, 320);
      const password = typeof body.password === 'string' ? body.password : '';

      if (!email) return fail(422, 'validation_error', 'Email wajib diisi.', { email: 'Wajib diisi.' });
      if (!password) return fail(422, 'validation_error', 'Password wajib diisi.', { password: 'Wajib diisi.' });

      try {
        const { data, error } = await db().auth.signInWithPassword({ email, password });
        console.log('[auth-debug] signIn:', error ? `error ${error.code ?? error.message}` : `ok user=${data.user?.id?.slice(0, 8)} session=${Boolean(data.session)}`);

        if (error) {
          // Pesan seragam: jangan membocorkan apakah email terdaftar atau tidak.
          return fail(401, 'invalid_credentials', 'Email atau password tidak sesuai.');
        }

        // Sesi valid belum cukup: akun harus terdaftar sebagai operator (BE-10).
        const { data: allowed } = await db().rpc('is_operator');
        if (allowed !== true) {
          await db().auth.signOut();
          return fail(403, 'not_operator', 'Akun ini tidak memiliki akses operator.');
        }

        return ok({ id: data.user.id, email: data.user.email ?? '' });
      } catch (cause) {
        return serverError('POST /api/admin/auth/login', cause);
      }
    })

    .post('/logout', async () => {
      try {
        const { error } = await db().auth.signOut();
        if (error) return serverError('POST /api/admin/auth/logout', error);
        return ok({ signedOut: true });
      } catch (cause) {
        return serverError('POST /api/admin/auth/logout', cause);
      }
    })

    .get('/session', async () => {
      try {
        const { data, error } = await db().auth.getUser();
        if (error || !data.user) return fail(401, 'no_session', 'Belum ada sesi aktif.');

        const { data: allowed } = await db().rpc('is_operator');
        if (allowed !== true) return fail(403, 'not_operator', 'Akun ini tidak memiliki akses operator.');

        return ok({ id: data.user.id, email: data.user.email ?? '' });
      } catch (cause) {
        return serverError('GET /api/admin/auth/session', cause);
      }
    })

    .post('/password', async ({ request }) => {
      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const current = typeof body.currentPassword === 'string' ? body.currentPassword : '';
      const next = typeof body.newPassword === 'string' ? body.newPassword : '';

      if (next.length < 8) {
        return fail(422, 'validation_error', 'Password baru minimal 8 karakter.', {
          newPassword: 'Minimal 8 karakter.'
        });
      }
      if (current === next) {
        return fail(422, 'validation_error', 'Password baru harus berbeda dari yang lama.', {
          newPassword: 'Harus berbeda dari password lama.'
        });
      }

      try {
        const supabase = db();
        const { data: auth, error: sessionError } = await supabase.auth.getUser();
        if (sessionError || !auth.user?.email) return fail(401, 'no_session', 'Belum ada sesi aktif.');

        const { data: allowed } = await supabase.rpc('is_operator');
        if (allowed !== true) return fail(403, 'not_operator', 'Akun ini tidak memiliki akses operator.');

        // Verifikasi password lama dulu: sesi yang terbuka di perangkat lain
        // tidak boleh bisa mengganti password tanpa mengetahuinya.
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: auth.user.email,
          password: current
        });
        if (verifyError) {
          return fail(401, 'invalid_credentials', 'Password saat ini tidak sesuai.', {
            currentPassword: 'Tidak sesuai.'
          });
        }

        const { error } = await supabase.auth.updateUser({ password: next });
        if (error) return fail(422, 'weak_password', 'Password baru ditolak. Gunakan kombinasi yang lebih kuat.');

        return ok({ updated: true });
      } catch (cause) {
        return serverError('POST /api/admin/auth/password', cause);
      }
    }, { body: t.Optional(t.Unknown()) });
}
