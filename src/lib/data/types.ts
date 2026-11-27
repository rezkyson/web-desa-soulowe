/**
 * Bentuk data yang dipakai komponen, apa adanya dari API.
 *
 * Nama field mengikuti kolom database (snake_case) supaya tidak ada lapisan
 * penerjemahan yang bisa salah tanpa ketahuan. Tipe lama di `types.ts` masih
 * dipakai panel admin selama integrasi berjalan, lalu dihapus.
 */

export interface MediaRef {
  storage_path: string;
  alt?: string | null;
  is_dummy?: boolean | null;
}

export interface Settings {
  logo: MediaRef | null;
  hero: MediaRef | null;
}

export interface Principal {
  name: string;
  greeting: string;
  is_dummy: boolean;
  photo: MediaRef | null;
}

export interface Contact {
  phone: string;
  message: string;
  is_dummy: boolean;
}

export interface Official {
  id: string;
  name: string;
  role: string;
  education?: string | null;
  display_order: number;
  photo: MediaRef | null;
}

export interface BpdMember {
  id: string;
  name: string;
  role: string;
  display_order: number;
  photo: MediaRef | null;
}

export interface Statistic {
  id: string;
  year: number;
  category: string;
  label: string;
  value: number | null;
  unit: string;
  display_order: number;
}

export interface Facility {
  id: string;
  category: string;
  name: string;
  value: number | null;
  unit: string;
  condition: string | null;
  note: string | null;
  display_order: number;
  photo: MediaRef | null;
}

export interface FinanceItem {
  id: string;
  year: number;
  category: 'Pendapatan' | 'Belanja';
  name: string;
  value: number | null;
  source_note: string | null;
  display_order: number;
}

export interface NewsSummary {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  published_on: string;
  author: string | null;
  summary: string;
  is_dummy: boolean;
  cover: MediaRef | null;
}

export interface NewsDetail extends NewsSummary {
  body: string;
  images: {
    alt: string;
    display_order: number;
    media: MediaRef | null;
  }[];
}

export interface AlbumSummary {
  id: string;
  name: string;
  slug: string;
  event_date: string;
  description: string;
  is_dummy: boolean;
  cover: MediaRef | null;
  /** Supabase mengembalikan hitungan sebagai array satu elemen. */
  photos: { count: number }[] | null;
}

export interface AlbumPhoto {
  id: string;
  alt: string;
  display_order: number;
  media: MediaRef | null;
  featured?: boolean;
}

export interface AlbumDetail extends Omit<AlbumSummary, 'photos'> {
  cover_media_id: string | null;
  photos: AlbumPhoto[];
}

/** Bentuk respons seragam dari seluruh API. */
export type ApiEnvelope<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string; fields?: Record<string, string> } };
