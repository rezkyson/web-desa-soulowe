import { Elysia } from 'elysia';
import { createSupabaseServerClient } from '$lib/server/supabase';
import { ok, fail, serverError } from '$lib/server/api';
import type { Cookies } from '@sveltejs/kit';

/**
 * API publik: hanya baca, tanpa sesi. Semua query memakai klien anon sehingga
 * RLS tetap menjadi penjaga terakhir walaupun ada kesalahan di lapisan ini.
 */
export function publicApi(cookies: Cookies) {
  const db = () => createSupabaseServerClient(cookies);

  return new Elysia({ prefix: '/api/public' })
    .get('/settings', async () => {
      try {
        const { data, error } = await db()
          .from('site_settings')
          .select('logo:media_assets!site_settings_logo_media_id_fkey(storage_path, alt), hero:media_assets!site_settings_hero_media_id_fkey(storage_path, alt)')
          .maybeSingle();

        if (error) return serverError('GET /api/public/settings', error);
        if (!data) return fail(404, 'not_found', 'Pengaturan situs belum tersedia.');
        return ok(data);
      } catch (cause) {
        return serverError('GET /api/public/settings', cause);
      }
    })

    .get('/principal', async () => {
      try {
        const { data, error } = await db()
          .from('principal_profile')
          .select('name, greeting, is_dummy, photo:media_assets(storage_path, alt)')
          .maybeSingle();

        if (error) return serverError('GET /api/public/principal', error);
        if (!data) return fail(404, 'not_found', 'Profil Kepala Desa belum tersedia.');
        return ok(data);
      } catch (cause) {
        return serverError('GET /api/public/principal', cause);
      }
    })

    .get('/officials', async () => {
      try {
        const { data, error } = await db()
          .from('village_officials')
          .select('id, name, role, education, display_order, photo:media_assets(storage_path, alt)')
          .order('display_order', { ascending: true })
          .order('name', { ascending: true });

        if (error) return serverError('GET /api/public/officials', error);
        return ok(data ?? []);
      } catch (cause) {
        return serverError('GET /api/public/officials', cause);
      }
    })

    .get('/bpd', async () => {
      try {
        const { data, error } = await db()
          .from('bpd_members')
          .select('id, name, role, display_order, photo:media_assets(storage_path, alt)')
          .order('display_order', { ascending: true })
          .order('name', { ascending: true });

        if (error) return serverError('GET /api/public/bpd', error);
        return ok(data ?? []);
      } catch (cause) {
        return serverError('GET /api/public/bpd', cause);
      }
    })

    .get('/statistics', async () => {
      try {
        const { data, error } = await db()
          .from('statistics')
          .select('id, year, category, label, value, unit, display_order')
          .eq('year', 2026)
          .order('category', { ascending: true })
          .order('display_order', { ascending: true });

        if (error) return serverError('GET /api/public/statistics', error);
        return ok(data ?? []);
      } catch (cause) {
        return serverError('GET /api/public/statistics', cause);
      }
    })

    .get('/facilities', async () => {
      try {
        const { data, error } = await db()
          .from('facilities')
          .select('id, category, name, value, unit, condition, note, display_order, photo:media_assets(storage_path, alt)')
          .order('category', { ascending: true })
          .order('display_order', { ascending: true });

        if (error) return serverError('GET /api/public/facilities', error);
        return ok(data ?? []);
      } catch (cause) {
        return serverError('GET /api/public/facilities', cause);
      }
    })

    .get('/finance', async () => {
      try {
        // Tidak ada perhitungan total, surplus, atau defisit. Nilai apa adanya.
        const { data, error } = await db()
          .from('financial_data')
          .select('id, year, category, name, value, source_note, display_order')
          .eq('year', 2026)
          .order('category', { ascending: true })
          .order('display_order', { ascending: true });

        if (error) return serverError('GET /api/public/finance', error);
        return ok(data ?? []);
      } catch (cause) {
        return serverError('GET /api/public/finance', cause);
      }
    })

    .get('/contact', async () => {
      try {
        const { data, error } = await db()
          .from('service_contacts')
          .select('phone, message, is_dummy')
          .maybeSingle();

        if (error) return serverError('GET /api/public/contact', error);
        if (!data) return fail(404, 'not_found', 'Kontak layanan belum tersedia.');
        return ok(data);
      } catch (cause) {
        return serverError('GET /api/public/contact', cause);
      }
    })

    .get('/news', async () => {
      try {
        const limit = 20;
        const { data, error } = await db()
          .from('news')
          .select('id, title, slug, category, published_on, author, summary, is_dummy, cover:media_assets(storage_path, alt)')
          .order('published_on', { ascending: false })
          .limit(limit);

        if (error) return serverError('GET /api/public/news', error);
        return ok(data ?? []);
      } catch (cause) {
        return serverError('GET /api/public/news', cause);
      }
    })

    .get('/news/:slug', async ({ params }) => {
      try {
        const { data, error } = await db()
          .from('news')
          .select('id, title, slug, category, published_on, author, summary, body, is_dummy, cover:media_assets(storage_path, alt), images:news_images(alt, display_order, media:media_assets(storage_path, alt))')
          .eq('slug', params.slug)
          .maybeSingle();

        if (error) return serverError('GET /api/public/news/:slug', error);
        if (!data) return fail(404, 'not_found', 'Berita tidak ditemukan.');
        return ok(data);
      } catch (cause) {
        return serverError('GET /api/public/news/:slug', cause);
      }
    })

    .get('/albums', async () => {
      try {
        const { data, error } = await db()
          .from('gallery_albums')
          .select('id, name, slug, event_date, description, is_dummy, cover:media_assets(storage_path, alt), photos:gallery_images(count)')
          .order('event_date', { ascending: false });

        if (error) return serverError('GET /api/public/albums', error);
        return ok(data ?? []);
      } catch (cause) {
        return serverError('GET /api/public/albums', cause);
      }
    })

    .get('/albums/:slug', async ({ params }) => {
      try {
        const { data, error } = await db()
          .from('gallery_albums')
          .select('id, name, slug, event_date, description, is_dummy, cover_media_id, photos:gallery_images(id, alt, display_order, media:media_assets(id, storage_path, alt))')
          .eq('slug', params.slug)
          .maybeSingle();

        if (error) return serverError('GET /api/public/albums/:slug', error);
        if (!data) return fail(404, 'not_found', 'Album tidak ditemukan.');

        // Relasi to-one kadang diketik sebagai array oleh generator tipe
        // Supabase, jadi dirapikan dulu sebelum dipakai.
        const first = <T>(value: T | T[] | null): T | null =>
          Array.isArray(value) ? (value[0] ?? null) : value;

        // Urutkan foto dan tandai unggulan, supaya UI tidak perlu menebak.
        const photos = [...(data.photos ?? [])]
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map(photo => ({
            ...photo,
            featured: first(photo.media)?.id === data.cover_media_id
          }));

        return ok({ ...data, photos });
      } catch (cause) {
        return serverError('GET /api/public/albums/:slug', cause);
      }
    });
}
