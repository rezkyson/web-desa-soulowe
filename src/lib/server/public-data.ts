import { createSupabasePublicClient } from '$lib/server/supabase';
import { mediaUrl } from '$lib/media';
import type {
  Settings, Principal, Contact, Official, BpdMember, Statistic,
  Facility, FinanceItem, NewsSummary, NewsDetail, AlbumSummary, AlbumDetail
} from '$lib/data/types';

/**
 * Pembacaan data publik untuk SSR.
 *
 * Sengaja memanggil database langsung, bukan HTTP ke `/api/public/*`.
 * Alasannya: saat SSR, memanggil HTTP ke diri sendiri menambah satu lompatan
 * jaringan per permintaan, dan di Vercel alamat asal request belum tentu bisa
 * dijangkau dari fungsi. Keduanya membaca tabel yang sama dengan kunci
 * publishable, jadi RLS tetap menjadi penjaga dan hasilnya identik.
 *
 * Yang dikembalikan adalah bentuk akhir untuk komponen. Tautan media tidak
 * diselesaikan di sini: komponen memakai `mediaUrl()` supaya halaman dan
 * komponen berbagi satu aturan.
 */

const SELECT = {
  settings:
    'logo:media_assets!site_settings_logo_media_id_fkey(storage_path, alt, is_dummy), ' +
    'hero:media_assets!site_settings_hero_media_id_fkey(storage_path, alt, is_dummy)',
  principal: 'name, greeting, is_dummy, photo:media_assets(storage_path, alt, is_dummy)',
  contact: 'phone, message, is_dummy',
  officials: 'id, name, role, education, display_order, photo:media_assets(storage_path, alt, is_dummy)',
  bpd: 'id, name, role, display_order, photo:media_assets(storage_path, alt, is_dummy)',
  statistics: 'id, year, category, label, value, unit, display_order',
  facilities:
    'id, category, name, value, unit, condition, note, display_order, ' +
    'photo:media_assets(storage_path, alt, is_dummy)',
  finance: 'id, year, category, name, value, source_note, display_order',
  newsList:
    'id, title, slug, category, published_on, author, summary, is_dummy, ' +
    'cover:media_assets(storage_path, alt, is_dummy)',
  newsDetail:
    'id, title, slug, category, published_on, author, summary, body, is_dummy, ' +
    'cover:media_assets(storage_path, alt, is_dummy), ' +
    'images:news_images(alt, display_order, media:media_assets(storage_path, alt, is_dummy))',
  albumList:
    'id, name, slug, event_date, description, is_dummy, ' +
    'cover:media_assets(storage_path, alt, is_dummy), photos:gallery_images(count)',
  albumDetail:
    'id, name, slug, event_date, description, is_dummy, cover_media_id, ' +
    'cover:media_assets(storage_path, alt, is_dummy), ' +
    'photos:gallery_images(id, alt, display_order, media:media_assets(id, storage_path, alt, is_dummy))'
} as const;

/** Relasi to-one kadang diketik sebagai array oleh generator tipe Supabase. */
function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * Melempar error apa adanya, supaya halaman bisa membedakan "gagal memuat"
 * dari "belum ada data". Menelan error di sini akan membuat halaman kosong
 * yang tampak normal padahal backend bermasalah.
 */
function must<T>(data: T | null, error: { message: string } | null, what: string): T {
  if (error) throw new Error(`Gagal memuat ${what}: ${error.message}`);
  if (data === null) throw new Error(`Gagal memuat ${what}: data kosong.`);
  return data;
}

export async function getSettings(): Promise<Settings | null> {
  const { data, error } = await createSupabasePublicClient()
    .from('site_settings')
    .select(SELECT.settings)
    .maybeSingle();
  if (error) throw new Error(`Gagal memuat pengaturan situs: ${error.message}`);
  if (!data) return null;

  // Relasi bertipe to-one kadang diketik sebagai array oleh generator tipe.
  const row = data as unknown as { logo: never; hero: never };
  return {
    logo: first(row.logo),
    hero: first(row.hero)
  };
}

export async function getPrincipal(): Promise<Principal | null> {
  const { data, error } = await createSupabasePublicClient()
    .from('principal_profile')
    .select(SELECT.principal)
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

export async function getContact(): Promise<Contact | null> {
  const { data, error } = await createSupabasePublicClient()
    .from('service_contacts')
    .select(SELECT.contact)
    .maybeSingle();
  if (error) throw new Error(`Gagal memuat kontak layanan: ${error.message}`);
  return data ?? null;
}

export async function getOfficials(): Promise<Official[]> {
  const { data, error } = await createSupabasePublicClient()
    .from('village_officials')
    .select(SELECT.officials)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  return (must(data, error, 'perangkat desa') as unknown as Official[]).map(row => ({
    ...row,
    photo: first(row.photo as never)
  }));
}

export async function getBpd(): Promise<BpdMember[]> {
  const { data, error } = await createSupabasePublicClient()
    .from('bpd_members')
    .select(SELECT.bpd)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  return (must(data, error, 'anggota BPD') as unknown as BpdMember[]).map(row => ({
    ...row,
    photo: first(row.photo as never)
  }));
}

export async function getStatistics(): Promise<Statistic[]> {
  const { data, error } = await createSupabasePublicClient()
    .from('statistics')
    .select(SELECT.statistics)
    .eq('year', 2026)
    .order('category', { ascending: true })
    .order('display_order', { ascending: true });

  return must(data, error, 'statistik') as unknown as Statistic[];
}

export async function getFacilities(): Promise<Facility[]> {
  const { data, error } = await createSupabasePublicClient()
    .from('facilities')
    .select(SELECT.facilities)
    .order('category', { ascending: true })
    .order('display_order', { ascending: true });

  return (must(data, error, 'sarana prasarana') as unknown as Facility[]).map(row => ({
    ...row,
    photo: first(row.photo as never)
  }));
}

export async function getFinance(): Promise<FinanceItem[]> {
  const { data, error } = await createSupabasePublicClient()
    .from('financial_data')
    .select(SELECT.finance)
    .eq('year', 2026)
    .order('category', { ascending: true })
    .order('display_order', { ascending: true });

  return must(data, error, 'data keuangan') as unknown as FinanceItem[];
}

/** 20 berita terbaru. Batas ini sama dengan API publik. */
export async function getNews(limit = 20): Promise<NewsSummary[]> {
  const { data, error } = await createSupabasePublicClient()
    .from('news')
    .select(SELECT.newsList)
    .order('published_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  return (must(data, error, 'berita') as unknown as NewsSummary[]).map(row => ({
    ...row,
    cover: first(row.cover as never)
  }));
}

/** Satu berita menurut slug, atau null kalau tidak ada. */
export async function getNewsBySlug(slug: string): Promise<NewsDetail | null> {
  const { data, error } = await createSupabasePublicClient()
    .from('news')
    .select(SELECT.newsDetail)
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(`Gagal memuat berita: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as NewsDetail;
  return {
    ...row,
    cover: first(row.cover as never),
    images: [...(row.images ?? [])]
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map(image => ({ ...image, media: first(image.media as never) }))
  };
}

export async function getAlbums(): Promise<AlbumSummary[]> {
  const { data, error } = await createSupabasePublicClient()
    .from('gallery_albums')
    .select(SELECT.albumList)
    .order('event_date', { ascending: false });

  return (must(data, error, 'album galeri') as unknown as AlbumSummary[]).map(row => ({
    ...row,
    cover: first(row.cover as never)
  }));
}

export async function getAlbumBySlug(slug: string): Promise<AlbumDetail | null> {
  const { data, error } = await createSupabasePublicClient()
    .from('gallery_albums')
    .select(SELECT.albumDetail)
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(`Gagal memuat album: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as AlbumDetail;
  return {
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
  };
}

/**
 * Semua foto dari album terbaru, untuk slideshow hero.
 * Diurutkan album terbaru lebih dulu, foto tanpa tautan dibuang, dan gambar
 * ganda dihapus supaya slideshow tidak menampilkan foto yang sama dua kali.
 */
export async function getHeroSlides(): Promise<{ url: string; alt: string }[]> {
  const albums = await getAlbums();
  const slides: { url: string; alt: string }[] = [];
  const seen = new Set<string>();

  for (const album of albums) {
    const detail = await getAlbumBySlug(album.slug);
    if (!detail) continue;

    for (const photo of detail.photos) {
      if (!photo.media?.storage_path) continue;
      const url = mediaUrl(photo.media);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      slides.push({
        url,
        alt: `${photo.alt || album.name} (album ${album.name})`
      });
    }
  }

  return slides;
}
