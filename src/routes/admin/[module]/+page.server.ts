import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import {
  adminPrincipal, adminOfficials, adminBpd, adminStatistics,
  adminFacilities, adminFinance, adminNews, adminAlbums,
  adminSettings, adminContact, adminMedia
} from '$lib/server/admin-data';

const MODULES = [
  'sambutan', 'pemerintahan', 'statistik', 'fasilitas', 'keuangan',
  'berita', 'galeri', 'whatsapp', 'media', 'akun'
] as const;

/**
 * Memuat data sesuai modul yang dibuka saja.
 *
 * Satu loader untuk semua modul lebih mudah, tetapi memuat seluruh tabel pada
 * setiap halaman akan membuat panel terasa lambat dan membuat satu tabel rusak
 * menjatuhkan halaman yang tidak memakainya.
 */
export const load: PageServerLoad = async ({ cookies, params }) => {
  const module = params.module;
  if (!MODULES.includes(module as (typeof MODULES)[number])) error(404, 'Modul tidak ditemukan');

  switch (module) {
    case 'sambutan':
      return { module, principal: await adminPrincipal(cookies) };

    case 'pemerintahan': {
      const [officials, bpd] = await Promise.all([adminOfficials(cookies), adminBpd(cookies)]);
      return { module, officials, bpd };
    }

    case 'statistik':
      return { module, statistics: await adminStatistics(cookies) };

    case 'fasilitas':
      return { module, facilities: await adminFacilities(cookies) };

    case 'keuangan':
      return { module, finance: await adminFinance(cookies) };

    case 'berita':
      return { module, news: await adminNews(cookies) };

    case 'galeri':
      return { module, albums: await adminAlbums(cookies) };

    case 'whatsapp':
      return { module, contact: await adminContact(cookies) };

    case 'media': {
      const [media, settings] = await Promise.all([adminMedia(cookies), adminSettings(cookies)]);
      return { module, media, settings };
    }

    case 'akun':
      return { module };

    default:
      return { module };
  }
};
