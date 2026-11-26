import type { Handle } from '@sveltejs/kit';
import { getOperator } from '$lib/server/supabase';

/**
 * Membaca sesi operator sekali per request dan menaruhnya di locals.
 *
 * Sengaja tidak melempar error kalau Supabase belum dikonfigurasi: frontend
 * masih memakai data mock selama Fase 2, dan halaman publik harus tetap bisa
 * dibuka tanpa .env. Endpoint yang benar-benar butuh data akan gagal sendiri
 * dengan pesan yang jelas.
 */
export const handle: Handle = async ({ event, resolve }) => {
  try {
    event.locals.operator = await getOperator(event.cookies);
  } catch {
    event.locals.operator = null;
  }

  return resolve(event);
};
