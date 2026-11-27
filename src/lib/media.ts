import { env } from '$env/dynamic/public';

/**
 * Referensi media dari database. `is_dummy` menandai gambar contoh yang
 * dibundel bersama aplikasi, bukan hasil unggahan operator.
 */
export type MediaRef =
  | { storage_path: string; alt?: string | null; is_dummy?: boolean | null }
  | null
  | undefined;

/**
 * URL gambar untuk sebuah media.
 *
 * Dua sumber, dan bedanya disengaja:
 *   - media contoh (is_dummy) ada di folder `static/`, karena seed mencatat
 *     path-nya tetapi file-nya memang tidak pernah diunggah ke Storage.
 *     Mengarahkannya ke Storage akan menghasilkan 404 untuk semua gambar awal.
 *   - media unggahan operator ada di bucket `media`, jadi URL-nya dari Storage.
 *
 * Tidak ada fallback diam-diam: kalau tidak ada media, hasilnya string kosong
 * dan komponen wajib menampilkan keadaan kosong, bukan gambar karangan.
 */
export function mediaUrl(media: MediaRef, fallback = ''): string {
  if (!media?.storage_path) return fallback;

  if (media.is_dummy) return `/${media.storage_path.replace(/^\/+/, '')}`;

  const base = env.PUBLIC_SUPABASE_URL;
  if (!base) return '';

  return `${base}/storage/v1/object/public/media/${media.storage_path.replace(/^\/+/, '')}`;
}
