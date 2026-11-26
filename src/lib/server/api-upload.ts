import type { Cookies } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import { requireOperator } from '$lib/server/guard';
import { ok, fail, serverError, text, intOrZero } from '$lib/server/api';
import { Elysia } from 'elysia';

/**
 * Upload media ke Supabase Storage (BE-21 sampai BE-24).
 *
 * Batas dan aturan yang ditegakkan di sini, bukan hanya di UI:
 *   - maksimal 5 MB per file
 *   - hanya JPG/JPEG/PNG/WebP
 *   - tipe isi diperiksa dari magic bytes, bukan dari nama file atau header
 *     MIME yang dikirim browser (keduanya mudah dipalsukan)
 *   - path dibuat sendiri, nama unggahan tidak dipakai mentah
 *
 * Bucket `media` juga punya batas yang sama di level Supabase, jadi ada dua
 * lapisan: aplikasi dan Storage.
 */
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED = [
  { mime: 'image/jpeg', ext: 'jpg' },
  { mime: 'image/png', ext: 'png' },
  { mime: 'image/webp', ext: 'webp' }
] as const;

/** Mengenali format dari beberapa byte pertama file. */
function sniff(bytes: Uint8Array): string | null {
  // JPEG: FF D8 FF
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length > 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    bytes.length > 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

/** Nama file aman: hanya huruf, angka, tanda hubung. Tidak memakai nama asli. */
function safeName(original: string): string {
  const base = original.replace(/\.[^.]+$/, '');
  const slug = base
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return slug || 'gambar';
}

const FOLDERS = ['branding', 'profil', 'perangkat', 'berita', 'galeri', 'fasilitas'] as const;

export function uploadApi(cookies: Cookies) {
  const db = () => createSupabaseServerClient(cookies);

  return new Elysia({ prefix: '/api/admin/media' })

    .post('/upload', async ({ request }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      let form: FormData;
      try {
        form = await request.formData();
      } catch {
        return fail(400, 'invalid_body', 'Unggahan harus berupa multipart/form-data.');
      }

      const file = form.get('file');
      if (!(file instanceof File)) {
        return fail(422, 'validation_error', 'Berkas belum dipilih.', { file: 'Wajib diisi.' });
      }

      if (file.size === 0) {
        return fail(422, 'validation_error', 'Berkas kosong.', { file: 'Berkas kosong.' });
      }
      if (file.size > MAX_BYTES) {
        return fail(413, 'file_too_large', 'Ukuran berkas melebihi 5 MB.', {
          file: `Ukuran ${(file.size / 1024 / 1024).toFixed(1)} MB, maksimal 5 MB.`
        });
      }

      const bytes = new Uint8Array(await file.arrayBuffer());
      const detected = sniff(bytes);
      if (!detected) {
        return fail(415, 'unsupported_type', 'Hanya JPG, PNG, atau WebP yang diterima.', {
          file: 'Format berkas tidak dikenali.'
        });
      }

      // Header MIME dari browser boleh salah atau dipalsukan. Yang dipakai
      // adalah hasil pemeriksaan isi berkas.
      const format = ALLOWED.find(item => item.mime === detected)!;

      const folder = text(form.get('folder'), 40) ?? 'galeri';
      if (!FOLDERS.includes(folder as (typeof FOLDERS)[number])) {
        return fail(422, 'validation_error', 'Folder tidak dikenal.', {
          folder: `Pilih salah satu: ${FOLDERS.join(', ')}.`
        });
      }

      const alt = text(form.get('alt'), 300) ?? '';
      const stamp = new Date().toISOString().slice(0, 10);
      const unique = crypto.randomUUID().slice(0, 8);
      const path = `${folder}/${stamp}-${safeName(file.name)}-${unique}.${format.ext}`;

      try {
        const supabase = db();

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(path, bytes, { contentType: format.mime, upsert: false });

        if (uploadError) {
          // Storage menolak dengan pesan sendiri kalau batasnya dilanggar.
          const message = uploadError.message ?? '';
          if (/exceeded|too large|size/i.test(message)) {
            return fail(413, 'file_too_large', 'Ukuran berkas melebihi 5 MB.');
          }
          if (/mime|content type/i.test(message)) {
            return fail(415, 'unsupported_type', 'Format berkas tidak didukung.');
          }
          return serverError('POST /api/admin/media/upload (storage)', uploadError);
        }

        // Catat metadata. Kalau langkah ini gagal, file yatim di Storage
        // dibersihkan lagi supaya tidak menumpuk tanpa rujukan.
        const { data, error: rowError } = await supabase.from('media_assets').insert({
          storage_path: path,
          mime_type: format.mime,
          byte_size: file.size,
          alt,
          is_dummy: false
        }).select('id, storage_path, mime_type, byte_size, alt').single();

        if (rowError) {
          await supabase.storage.from('media').remove([path]);
          return serverError('POST /api/admin/media/upload (metadata)', rowError);
        }

        return ok(data, 201);
      } catch (cause) {
        return serverError('POST /api/admin/media/upload', cause);
      }
    })

    .get('/list', async () => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      try {
        const { data, error } = await db().from('media_assets')
          .select('id, storage_path, mime_type, byte_size, alt, created_at')
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) return serverError('GET /api/admin/media/list', error);
        return ok(data ?? []);
      } catch (cause) {
        return serverError('GET /api/admin/media/list', cause);
      }
    })

    .delete('/:id', async ({ params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      try {
        const supabase = db();

        const { data: asset, error: readError } = await supabase.from('media_assets')
          .select('id, storage_path')
          .eq('id', params.id)
          .maybeSingle();

        if (readError) return serverError('DELETE /api/admin/media/:id (read)', readError);
        if (!asset) return fail(404, 'not_found', 'Media tidak ditemukan.');

        // Jangan hapus file yang masih dipakai konten lain (BE-24).
        const [news, albums, newsImages, galleryImages, officials, bpd, facilities, principal] =
          await Promise.all([
            supabase.from('news').select('id', { count: 'exact', head: true }).eq('cover_media_id', asset.id),
            supabase.from('gallery_albums').select('id', { count: 'exact', head: true }).eq('cover_media_id', asset.id),
            supabase.from('news_images').select('id', { count: 'exact', head: true }).eq('media_id', asset.id),
            supabase.from('gallery_images').select('id', { count: 'exact', head: true }).eq('media_id', asset.id),
            supabase.from('village_officials').select('id', { count: 'exact', head: true }).eq('photo_media_id', asset.id),
            supabase.from('bpd_members').select('id', { count: 'exact', head: true }).eq('photo_media_id', asset.id),
            supabase.from('facilities').select('id', { count: 'exact', head: true }).eq('photo_media_id', asset.id),
            supabase.from('principal_profile').select('id', { count: 'exact', head: true }).eq('photo_media_id', asset.id)
          ]);

        const used =
          (news.count ?? 0) + (albums.count ?? 0) + (newsImages.count ?? 0) +
          (galleryImages.count ?? 0) + (officials.count ?? 0) + (bpd.count ?? 0) +
          (facilities.count ?? 0) + (principal.count ?? 0);

        if (used > 0) {
          return fail(409, 'media_in_use', `Media masih dipakai di ${used} tempat. Lepaskan dulu sebelum menghapus.`);
        }

        const { error: removeError } = await supabase.storage.from('media').remove([asset.storage_path]);
        if (removeError) return serverError('DELETE /api/admin/media/:id (storage)', removeError);

        const { error: deleteError } = await supabase.from('media_assets').delete().eq('id', asset.id);
        if (deleteError) return serverError('DELETE /api/admin/media/:id (row)', deleteError);

        return ok({ deleted: true });
      } catch (cause) {
        return serverError('DELETE /api/admin/media/:id', cause);
      }
    })

    .patch('/:id', async ({ request, params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      let body: Record<string, unknown> | null = null;
      try {
        body = await request.json();
      } catch {
        return fail(400, 'invalid_body', 'Permintaan tidak valid.');
      }
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      try {
        const { error } = await db().from('media_assets')
          .update({ alt: text(body.alt, 300) ?? '' })
          .eq('id', params.id);
        if (error) return serverError('PATCH /api/admin/media/:id', error);
        return ok({ updated: true });
      } catch (cause) {
        return serverError('PATCH /api/admin/media/:id', cause);
      }
    })

    .get('/limits', async () => {
      // Berguna untuk UI: batas yang benar-benar ditegakkan server.
      const denied = await requireOperator(cookies);
      if (denied) return denied;
      return ok({
        maxBytes: MAX_BYTES,
        maxMegabytes: MAX_BYTES / 1024 / 1024,
        formats: ALLOWED.map(item => item.mime),
        folders: [...FOLDERS]
      });
    });
}
