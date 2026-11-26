import type { RequestHandler } from './$types';
import type { Cookies } from '@sveltejs/kit';
import { contentApi } from '$lib/server/api-content';
import { mediaApi } from '$lib/server/api-media';
import { fail } from '$lib/server/api';

/**
 * Titik masuk API admin untuk mutasi konten.
 *
 * Elysia dipasang sebagai handler Web Request/Response, tanpa app.listen().
 * Setiap handler di dalamnya memeriksa operator lebih dulu, lalu RLS menjadi
 * penjaga kedua di database.
 */
async function dispatch(request: Request, cookies: Cookies) {
  try {
    const content = await contentApi(cookies).handle(request);
    // Elysia mengembalikan 404 untuk route yang tidak dikenal, jadi route yang
    // tidak ditangani modul pertama dicoba di modul berita/galeri.
    if (content.status !== 404) return content;
    return await mediaApi(cookies).handle(request);
  } catch (cause) {
    console.error('[api] admin content gagal', cause);
    return fail(503, 'unavailable', 'Layanan belum dapat diakses. Coba lagi nanti.');
  }
}

export const GET: RequestHandler = ({ request, cookies }) => dispatch(request, cookies);
export const POST: RequestHandler = ({ request, cookies }) => dispatch(request, cookies);
export const PATCH: RequestHandler = ({ request, cookies }) => dispatch(request, cookies);
export const DELETE: RequestHandler = ({ request, cookies }) => dispatch(request, cookies);

export const prerender = false;
