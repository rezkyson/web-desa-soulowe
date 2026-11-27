import type { PageServerLoad } from './$types';
import {
  getSettings, getPrincipal, getContact, getStatistics,
  getNews, getAlbums, getHeroSlides
} from '$lib/server/public-data';

/**
 * Data beranda.
 *
 * Kalau backend gagal, halaman tidak boleh menampilkan angka atau foto
 * karangan. Karena itu kegagalan dilempar sebagai error 500 dengan pesan yang
 * jujur, dan SvelteKit menampilkan halaman error, bukan beranda setengah jadi.
 */
export const load: PageServerLoad = async () => {
  const [settings, principal, contact, statistics, news, albums, slides] = await Promise.all([
    getSettings(),
    getPrincipal(),
    getContact(),
    getStatistics(),
    getNews(3),
    getAlbums(),
    getHeroSlides()
  ]);

  return {
    settings,
    principal,
    contact,
    statistics,
    news,
    albums,
    slides
  };
};
