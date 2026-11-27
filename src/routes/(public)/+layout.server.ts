import type { LayoutServerLoad } from './$types';
import { getSettings, getContact } from '$lib/server/public-data';

/**
 * Data yang dibutuhkan seluruh halaman publik: logo dan nomor layanan.
 *
 * Ditaruh di layout supaya header, footer, dan halaman tidak memuat ulang
 * data yang sama. Kalau salah satu gagal, seluruh situs publik menampilkan
 * halaman error, bukan header tanpa logo.
 */
export const load: LayoutServerLoad = async () => {
  const [settings, contact] = await Promise.all([getSettings(), getContact()]);
  return { settings, contact };
};
