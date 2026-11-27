import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

/**
 * Penjaga seluruh route admin.
 *
 * `locals.operator` diisi oleh hook setelah memverifikasi sesi DAN keanggotaan
 * di `admin_users`. Jadi pemeriksaan di sini bukan satu-satunya penjaga:
 * endpoint API dan RLS juga menolak sendiri.
 *
 * Halaman login dikecualikan, kalau tidak pengguna tidak akan pernah bisa masuk.
 */
export const load: LayoutServerLoad = async ({ locals, url }) => {
  const isLogin = url.pathname === '/admin/login';

  if (!locals.operator && !isLogin) {
    redirect(303, `/admin/login?next=${encodeURIComponent(url.pathname)}`);
  }

  // Operator yang sudah masuk tidak perlu melihat form login lagi.
  if (locals.operator && isLogin) {
    redirect(303, '/admin');
  }

  return {
    operator: locals.operator ? { email: locals.operator.email } : null
  };
};
