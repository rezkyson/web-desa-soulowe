import { error } from '@sveltejs/kit';
export function load({ params }: { params: { section: string } }) {
  if (!['profil', 'pemerintahan', 'data', 'keuangan', 'berita', 'galeri', 'layanan', 'kontak'].includes(params.section)) error(404, 'Halaman tidak ditemukan');
  return { section: params.section };
}
