import type { PageServerLoad } from './$types';
import { adminDashboardCounts, adminNews } from '$lib/server/admin-data';

/**
 * Dashboard: angka nyata dari database, bukan mock.
 *
 * Kalau salah satu query gagal, halaman menampilkan error. Tidak ada angka
 * cadangan, karena angka palsu pada dashboard akan menyesatkan operator.
 */
export const load: PageServerLoad = async ({ cookies }) => {
  const [counts, news] = await Promise.all([
    adminDashboardCounts(cookies),
    adminNews(cookies)
  ]);

  return {
    counts,
    latestNews: news.slice(0, 5)
  };
};
