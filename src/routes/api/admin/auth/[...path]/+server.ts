import type { RequestHandler } from './$types';
import { authApi } from '$lib/server/api-auth';
import { fail } from '$lib/server/api';

/**
 * Titik masuk API admin untuk Auth. Elysia dipasang sebagai handler Web
 * Request/Response, sama seperti API publik.
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    return await authApi(cookies).handle(request);
  } catch (cause) {
    console.error('[api] POST /api/admin/auth gagal', cause);
    return fail(503, 'unavailable', 'Layanan belum dapat diakses. Coba lagi nanti.');
  }
};

export const GET: RequestHandler = async ({ request, cookies }) => {
  try {
    return await authApi(cookies).handle(request);
  } catch (cause) {
    console.error('[api] GET /api/admin/auth gagal', cause);
    return fail(503, 'unavailable', 'Layanan belum dapat diakses. Coba lagi nanti.');
  }
};

export const prerender = false;
