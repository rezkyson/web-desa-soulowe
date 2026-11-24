import { error } from '@sveltejs/kit';
export function load({ params }: { params: { section: string; slug: string } }) {
  if (!['berita', 'galeri'].includes(params.section)) error(404, 'Halaman tidak ditemukan');
  return { section: params.section, slug: params.slug };
}
