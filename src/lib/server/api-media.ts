import { Elysia } from 'elysia';
import type { Cookies } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import { requireOperator } from '$lib/server/guard';
import {
  ok, fail, serverError, readJson, required,
  isoDate, uniqueSlug, intOrZero
} from '$lib/server/api';

/**
 * API admin untuk berita dan galeri.
 *
 * Aturan PRD yang ditegakkan di sini:
 * - Simpan berarti terbit. Tidak ada endpoint draft, approval, atau sembunyikan.
 * - Edit judul tidak mengubah slug yang sudah ada; slug hanya dibuat saat
 *   pembuatan pertama.
 * - Foto unggulan album harus salah satu foto album itu; trigger database
 *   menolak yang lain, dan API memberi pesan yang bisa ditindaklanjuti.
 */
export function mediaApi(cookies: Cookies) {
  const db = () => createSupabaseServerClient(cookies);



  async function newsSlug(title: string) {
    return uniqueSlug(title, async candidate => {
      const { data } = await db().from('news').select('id').eq('slug', candidate).limit(1);
      return Boolean(data && data.length);
    });
  }

  async function albumSlug(name: string) {
    return uniqueSlug(name, async candidate => {
      const { data } = await db().from('gallery_albums').select('id').eq('slug', candidate).limit(1);
      return Boolean(data && data.length);
    });
  }

  return new Elysia({ prefix: '/api/admin' })

    // -----------------------------------------------------------------------
    // Berita
    // -----------------------------------------------------------------------
    .post('/news', async ({ request }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const title = required(body.title, 180);
      const publishedOn = isoDate(body.publishedOn);
      const fields: Record<string, string> = {};
      if (!title) fields.title = 'Wajib diisi, maksimal 180 karakter.';
      if (!publishedOn) fields.publishedOn = 'Format tanggal harus YYYY-MM-DD.';
      if (Object.keys(fields).length) return fail(422, 'validation_error', 'Periksa kembali isian.', fields);

      try {
        const slug = await newsSlug(title!);
        const { data, error } = await db().from('news').insert({
          title,
          slug,
          category: required(body.category, 60),
          published_on: publishedOn,
          author: required(body.author, 120),
          summary: required(body.summary, 500) ?? '',
          body: required(body.body, 50000) ?? '',
          cover_media_id: body.coverMediaId ?? null
        }).select('id, slug').single();

        if (error) return serverError('POST /api/admin/news', error);
        return ok({ id: data.id, slug: data.slug }, 201);
      } catch (cause) {
        return serverError('POST /api/admin/news', cause);
      }
    })

    .patch('/news/:id', async ({ request, params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const title = required(body.title, 180);
      if (!title) return fail(422, 'validation_error', 'Judul wajib diisi.', { title: 'Wajib diisi.' });

      try {
        // Slug sengaja tidak ikut diubah, supaya tautan lama tidak mati.
        const { error } = await db().from('news').update({
          title,
          category: required(body.category, 60),
          published_on: isoDate(body.publishedOn) ?? undefined,
          author: required(body.author, 120),
          summary: required(body.summary, 500) ?? '',
          body: required(body.body, 50000) ?? '',
          cover_media_id: body.coverMediaId ?? null
        }).eq('id', params.id);

        if (error) return serverError('PATCH /api/admin/news/:id', error);
        return ok({ updated: true });
      } catch (cause) {
        return serverError('PATCH /api/admin/news/:id', cause);
      }
    })

    .delete('/news/:id', async ({ params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      try {
        // news_images ikut terhapus lewat on delete cascade. File Storage tidak
        // dihapus di sini: media bisa dipakai konten lain (BE-24).
        const { error } = await db().from('news').delete().eq('id', params.id);
        if (error) return serverError('DELETE /api/admin/news/:id', error);
        return ok({ deleted: true });
      } catch (cause) {
        return serverError('DELETE /api/admin/news/:id', cause);
      }
    })

    // -----------------------------------------------------------------------
    // Album dan foto
    // -----------------------------------------------------------------------
    .post('/albums', async ({ request }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const name = required(body.name, 180);
      const eventDate = isoDate(body.eventDate);
      const fields: Record<string, string> = {};
      if (!name) fields.name = 'Wajib diisi.';
      if (!eventDate) fields.eventDate = 'Format tanggal harus YYYY-MM-DD.';
      if (Object.keys(fields).length) return fail(422, 'validation_error', 'Periksa kembali isian.', fields);

      try {
        const slug = await albumSlug(name!);
        const { data, error } = await db().from('gallery_albums').insert({
          name, slug, event_date: eventDate,
          description: required(body.description, 1000) ?? ''
        }).select('id, slug').single();

        if (error) return serverError('POST /api/admin/albums', error);
        return ok({ id: data.id, slug: data.slug }, 201);
      } catch (cause) {
        return serverError('POST /api/admin/albums', cause);
      }
    })

    .patch('/albums/:id', async ({ request, params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const name = required(body.name, 180);
      if (!name) return fail(422, 'validation_error', 'Nama album wajib diisi.', { name: 'Wajib diisi.' });

      try {
        const { error } = await db().from('gallery_albums').update({
          name,
          event_date: isoDate(body.eventDate) ?? undefined,
          description: required(body.description, 1000) ?? ''
        }).eq('id', params.id);

        if (error) return serverError('PATCH /api/admin/albums/:id', error);
        return ok({ updated: true });
      } catch (cause) {
        return serverError('PATCH /api/admin/albums/:id', cause);
      }
    })

    .delete('/albums/:id', async ({ params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      try {
        const { error } = await db().from('gallery_albums').delete().eq('id', params.id);
        if (error) return serverError('DELETE /api/admin/albums/:id', error);
        return ok({ deleted: true });
      } catch (cause) {
        return serverError('DELETE /api/admin/albums/:id', cause);
      }
    })

    .post('/albums/:id/photos', async ({ request, params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const mediaId = required(body.mediaId, 64);
      if (!mediaId) return fail(422, 'validation_error', 'Pilih foto terlebih dahulu.', {
        mediaId: 'Wajib dipilih.'
      });

      try {
        const { data, error } = await db().from('gallery_images').insert({
          album_id: params.id,
          media_id: mediaId,
          alt: required(body.alt, 300) ?? '',
          display_order: intOrZero(body.order)
        }).select('id').single();

        if (error) {
          // 23505 = unique violation: foto itu sudah ada di album ini.
          if ((error as { code?: string }).code === '23505') {
            return fail(409, 'duplicate_photo', 'Foto itu sudah ada di album ini.');
          }
          return serverError('POST /api/admin/albums/:id/photos', error);
        }
        return ok({ id: data.id }, 201);
      } catch (cause) {
        return serverError('POST /api/admin/albums/:id/photos', cause);
      }
    })

    .patch('/albums/:id/cover', async ({ request, params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const mediaId = required(body.mediaId, 64);
      if (!mediaId) return fail(422, 'validation_error', 'Pilih foto unggulan.', { mediaId: 'Wajib dipilih.' });

      try {
        const { error } = await db().from('gallery_albums')
          .update({ cover_media_id: mediaId })
          .eq('id', params.id);

        if (error) {
          // Trigger database menolak foto yang bukan milik album ini.
          if ((error as { code?: string }).code === '23514') {
            return fail(422, 'cover_not_in_album', 'Foto unggulan harus salah satu foto pada album ini.');
          }
          return serverError('PATCH /api/admin/albums/:id/cover', error);
        }
        return ok({ updated: true });
      } catch (cause) {
        return serverError('PATCH /api/admin/albums/:id/cover', cause);
      }
    })

    .delete('/albums/:id/photos/:photoId', async ({ params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      try {
        const supabase = db();

        // Menghapus foto unggulan akan melanggar invariant, jadi tolak dengan
        // pesan yang jelas alih-alih membiarkan database melempar error kasar.
        const { data: album } = await supabase.from('gallery_albums')
          .select('cover_media_id').eq('id', params.id).maybeSingle();
        const { data: photo } = await supabase.from('gallery_images')
          .select('media_id').eq('id', params.photoId).maybeSingle();

        if (photo && album && photo.media_id === album.cover_media_id) {
          return fail(409, 'photo_is_cover', 'Pilih foto unggulan lain sebelum menghapus foto ini.');
        }

        const { error } = await supabase.from('gallery_images').delete().eq('id', params.photoId);
        if (error) return serverError('DELETE /api/admin/albums/:id/photos/:photoId', error);
        return ok({ deleted: true });
      } catch (cause) {
        return serverError('DELETE /api/admin/albums/:id/photos/:photoId', cause);
      }
    });
}
