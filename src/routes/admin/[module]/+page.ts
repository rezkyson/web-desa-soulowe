import { error } from '@sveltejs/kit';
export function load({ params }: { params: { module: string } }) {
  if (!['sambutan', 'pemerintahan', 'statistik', 'fasilitas', 'keuangan', 'berita', 'galeri', 'whatsapp', 'media', 'akun'].includes(params.module)) error(404, 'Modul tidak ditemukan');
  return { module: params.module };
}
