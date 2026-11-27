import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
  getPrincipal, getOfficials, getBpd, getStatistics,
  getFacilities, getFinance, getNews, getAlbums, getContact
} from '$lib/server/public-data';

/**
 * Data untuk halaman seksi.
 *
 * Hanya bagian yang benar-benar dipakai halaman itu yang dimuat. Memuat
 * semuanya untuk setiap seksi akan memperlambat halaman profil yang tidak
 * butuh statistik, dan membuat satu kegagalan kecil menjatuhkan semua halaman.
 */
const SECTIONS = ['profil', 'pemerintahan', 'data', 'keuangan', 'berita', 'galeri', 'layanan', 'kontak'] as const;
type Section = (typeof SECTIONS)[number];

export const load: PageServerLoad = async ({ params, setHeaders }) => {
  const section = params.section as Section;
  if (!SECTIONS.includes(section)) error(404, 'Halaman tidak ditemukan');

  // Halaman publik boleh di-cache singkat di CDN. Perubahan operator muncul
  // paling lambat setelah jendela ini, dan tidak ada cache yang tak terkendali.
  setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' });

  if (section === 'pemerintahan') {
    const [principal, officials, bpd] = await Promise.all([getPrincipal(), getOfficials(), getBpd()]);
    return { section, principal, officials, bpd };
  }

  if (section === 'data') {
    const [statistics, facilities] = await Promise.all([getStatistics(), getFacilities()]);
    return { section, statistics, facilities };
  }

  if (section === 'keuangan') {
    return { section, finance: await getFinance() };
  }

  if (section === 'berita') {
    return { section, news: await getNews(20) };
  }

  if (section === 'galeri') {
    return { section, albums: await getAlbums() };
  }

  if (section === 'layanan') {
    return { section, contact: await getContact() };
  }

  return { section };
};
