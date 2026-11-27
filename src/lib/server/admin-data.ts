import type { Cookies } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import type {
  Official, BpdMember, Statistic, Facility, FinanceItem,
  NewsDetail, AlbumDetail, Settings, Principal, Contact, MediaRef
} from '$lib/data/types';

/**
 * Pembacaan data untuk panel admin.
 *
 * Berbeda dari `public-data.ts`: klien di sini membawa sesi operator, sehingga
 * pembacaan tetap tunduk pada RLS tetapi bisa menjangkau kolom yang tidak
 * diekspos ke publik (misalnya `cover_media_id` untuk menyusun formulir).
 *
 * Tidak ada service role di jalur ini. Kalau sesi hilang, query akan gagal dan
 * halaman admin menampilkan keadaan yang jujur, bukan data kosong palsu.
 */

function db(cookies: Cookies) {
  return createSupabaseServerClient(cookies);
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function must<T>(data: T | null, error: { message: string } | null, what: string): T {
  if (error) throw new Error(`Gagal memuat ${what}: ${error.message}`);
  if (data === null) throw new Error(`Gagal memuat ${what}: data kosong.`);
  return data;
}

export async function adminOfficials(cookies: Cookies): Promise<Official[]> {
  const { data, error } = await db(cookies)
    .from('village_officials')
    .select('id, name, role, education, display_order, photo:media_assets(storage_path, alt, is_dummy)')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  return (must(data, error, 'perangkat desa') as unknown as Official[]).map(row => ({
    ...row,
    photo: first(row.photo as never)
  }));
}

export async function adminBpd(cookies: Cookies): Promise<BpdMember[]> {
  const { data, error } = await db(cookies)
    .from('bpd_members')
    .select('id, name, role, display_order, photo:media_assets(storage_path, alt, is_dummy)')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  return (must(data, error, 'anggota BPD') as unknown as BpdMember[]).map(row => ({
    ...row,
    photo: first(row.photo as never)
  }));
}

export async function adminStatistics(cookies: Cookies): Promise<Statistic[]> {
  const { data, error } = await db(cookies)
    .from('statistics')
    .select('id, year, category, label, value, unit, display_order')
    .eq('year', 2026)
    .order('category', { ascending: true })
    .order('display_order', { ascending: true });

  return must(data, error, 'statistik') as unknown as Statistic[];
}

export async function adminFacilities(cookies: Cookies): Promise<Facility[]> {
  const { data, error } = await db(cookies)
    .from('facilities')
    .select('id, category, name, value, unit, condition, note, display_order, photo:media_assets(storage_path, alt, is_dummy)')
    .order('category', { ascending: true })
    .order('display_order', { ascending: true });

  return (must(data, error, 'sarana prasarana') as unknown as Facility[]).map(row => ({
    ...row,
    photo: first(row.photo as never)
  }));
}

export async function adminFinance(cookies: Cookies): Promise<FinanceItem[]> {
  const { data, error } = await db(cookies)
    .from('financial_data')
    .select('id, year, category, name, value, source_note, display_order')
    .eq('year', 2026)
    .order('category', { ascending: true })
    .order('display_order', { ascending: true });

  return must(data, error, 'data keuangan') as unknown as FinanceItem[];
}

export async function adminNews(cookies: Cookies): Promise<NewsDetail[]> {
  const { data, error } = await db(cookies)
    .from('news')
    .select(
      'id, title, slug, category, published_on, author, summary, body, is_dummy, ' +
      'cover_media_id, cover:media_assets(storage_path, alt, is_dummy), ' +
      'images:news_images(id, alt, display_order, media:media_assets(id, storage_path, alt, is_dummy))'
    )
    .order('published_on', { ascending: false })
    .order('created_at', { ascending: false });

  return (must(data, error, 'berita') as unknown as (NewsDetail & { cover_media_id: string | null })[]).map(row => ({
    ...row,
    cover: first(row.cover as never),
    images: [...(row.images ?? [])]
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map(image => ({ ...image, media: first(image.media as never) }))
  }));
}

export async function adminAlbums(cookies: Cookies): Promise<AlbumDetail[]> {
  const { data, error } = await db(cookies)
    .from('gallery_albums')
    .select(
      'id, name, slug, event_date, description, is_dummy, cover_media_id, ' +
      'cover:media_assets(storage_path, alt, is_dummy), ' +
      'photos:gallery_images(id, alt, display_order, media:media_assets(id, storage_path, alt, is_dummy))'
    )
    .order('event_date', { ascending: false });

  return (must(data, error, 'album galeri') as unknown as AlbumDetail[]).map(row => ({
    ...row,
    cover: first(row.cover as never),
    photos: [...(row.photos ?? [])]
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map(photo => {
        const media = first(photo.media as never) as { id?: string } | null;
        return {
          ...photo,
          media: media as never,
          featured: Boolean(media?.id) && media?.id === row.cover_media_id
        };
      })
  }));
}

export interface MediaAsset {
  id: string;
  storage_path: string;
  mime_type: string;
  byte_size: number;
  alt: string;
  created_at: string;
}

export async function adminMedia(cookies: Cookies): Promise<MediaAsset[]> {
  const { data, error } = await db(cookies)
    .from('media_assets')
    .select('id, storage_path, mime_type, byte_size, alt, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  return must(data, error, 'daftar media') as unknown as MediaAsset[];
}

export async function adminSettings(cookies: Cookies): Promise<Settings | null> {
  const { data, error } = await db(cookies)
    .from('site_settings')
    .select(
      'logo:media_assets!site_settings_logo_media_id_fkey(storage_path, alt, is_dummy), ' +
      'hero:media_assets!site_settings_hero_media_id_fkey(storage_path, alt, is_dummy)'
    )
    .maybeSingle();

  if (error) throw new Error(`Gagal memuat pengaturan situs: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as { logo: never; hero: never };
  return { logo: first(row.logo), hero: first(row.hero) };
}

export async function adminPrincipal(cookies: Cookies): Promise<Principal | null> {
  const { data, error } = await db(cookies)
    .from('principal_profile')
    .select('name, greeting, is_dummy, photo:media_assets(storage_path, alt, is_dummy)')
    .maybeSingle();

  if (error) throw new Error(`Gagal memuat profil Kepala Desa: ${error.message}`);
  if (!data) return null;

  return {
    name: data.name,
    greeting: data.greeting,
    is_dummy: data.is_dummy,
    photo: first(data.photo as never)
  };
}

export async function adminContact(cookies: Cookies): Promise<Contact | null> {
  const { data, error } = await db(cookies)
    .from('service_contacts')
    .select('phone, message, is_dummy')
    .maybeSingle();

  if (error) throw new Error(`Gagal memuat kontak layanan: ${error.message}`);
  return data ?? null;
}

/** Ringkasan dashboard: jumlah berita dan album, tanpa memuat seluruh baris. */
export async function adminDashboardCounts(cookies: Cookies) {
  const supabase = db(cookies);
  const [news, albums] = await Promise.all([
    supabase.from('news').select('id', { count: 'exact', head: true }),
    supabase.from('gallery_albums').select('id', { count: 'exact', head: true })
  ]);

  if (news.error) throw new Error(`Gagal menghitung berita: ${news.error.message}`);
  if (albums.error) throw new Error(`Gagal menghitung album: ${albums.error.message}`);

  return { news: news.count ?? 0, albums: albums.count ?? 0 };
}

export type { MediaRef };
