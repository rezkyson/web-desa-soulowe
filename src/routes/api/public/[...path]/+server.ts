import type { RequestHandler } from './$types';
import { publicApi } from '$lib/server/api-public';
import { fail } from '$lib/server/api';

/**
 * Titik masuk API publik. Elysia dipasang sebagai handler Web Request/Response
 * di dalam SvelteKit, tanpa app.listen(), sesuai arsitektur deployment PRD.
 */
export const GET: RequestHandler = async ({ request, cookies }) => {
  try {
    return await publicApi(cookies).handle(request);
  } catch (cause) {
    // Detail konfigurasi hanya masuk log server. Klien mendapat pesan umum,
    // supaya nama env atau isi .env tidak bocor ke browser (BE-14).
    console.error('[api] GET /api/public gagal', cause);
    return fail(503, 'unavailable', 'Layanan data belum dapat diakses. Coba lagi nanti.');
  }
};

export const prerender = false;
