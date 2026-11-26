import type { RequestHandler } from './$types';
import type { Cookies } from '@sveltejs/kit';
import { contentApi } from '$lib/server/api-content';
import { mediaApi } from '$lib/server/api-media';
import { uploadApi } from '$lib/server/api-upload';
import { fail } from '$lib/server/api';

/**
 * Titik masuk API admin.
 *
 * Tiga modul berbagi prefix /api/admin. Elysia mengembalikan 404 untuk route
 * yang tidak dikenalnya, jadi modul dicoba berurutan sampai ada yang cocok.
 * Urutan penting: /media/* harus dicoba sebelum modul lain yang mungkin
 * menangkap path serupa.
 */
async function dispatch(request: Request, cookies: Cookies) {
  try {
    const upload = await uploadApi(cookies).handle(request);
    if (upload.status !== 404) return upload;

    const content = await contentApi(cookies).handle(request);
    if (content.status !== 404) return content;

    return await mediaApi(cookies).handle(request);
  } catch (cause) {
    console.error('[api] admin gagal', cause);
    return fail(503, 'unavailable', 'Layanan belum dapat diakses. Coba lagi nanti.');
  }
}

export const GET: RequestHandler = ({ request, cookies }) => dispatch(request, cookies);
export const POST: RequestHandler = ({ request, cookies }) => dispatch(request, cookies);
export const PATCH: RequestHandler = ({ request, cookies }) => dispatch(request, cookies);
export const DELETE: RequestHandler = ({ request, cookies }) => dispatch(request, cookies);

export const prerender = false;
