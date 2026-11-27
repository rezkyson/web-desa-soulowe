import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getNewsBySlug, getAlbumBySlug } from '$lib/server/public-data';

/**
 * Detail berita atau album menurut slug.
 *
 * Slug yang tidak ada menghasilkan 404 sungguhan, bukan halaman kosong dengan
 * status 200. Itu penting untuk mesin pencari dan untuk kejujuran tampilan.
 */
export const load: PageServerLoad = async ({ params, setHeaders }) => {
  if (!['berita', 'galeri'].includes(params.section)) error(404, 'Halaman tidak ditemukan');

  if (params.section === 'berita') {
    const item = await getNewsBySlug(params.slug);
    if (!item) error(404, 'Berita tidak ditemukan');
    setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' });
    return { section: 'berita' as const, slug: params.slug, item };
  }

  const album = await getAlbumBySlug(params.slug);
  if (!album) error(404, 'Album tidak ditemukan');
  setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' });
  return { section: 'galeri' as const, slug: params.slug, item: album };
};
