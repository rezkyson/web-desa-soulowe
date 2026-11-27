import type { Cookies } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';
import { requireOperator } from '$lib/server/guard';
import { Elysia } from 'elysia';
import {
  ok, fail, serverError, readJson, required,
  numberOrNull, intOrZero, normalizePhone
} from '$lib/server/api';

/**
 * API admin untuk mutasi konten umum: perangkat, BPD, statistik, fasilitas,
 * keuangan, profil Kepala Desa, pengaturan media, dan WhatsApp.
 *
 * Setiap handler memanggil requireOperator() lebih dulu. RLS tetap menjadi
 * penjaga kedua, tetapi pemeriksaan di sini memberi status HTTP yang benar
 * (401 vs 403) dan pesan yang bisa ditindaklanjuti.
 *
 * Tidak ada endpoint untuk konten tetap (sejarah, visi-misi, geografis, iklim,
 * penggunaan lahan, tipologi, orbitasi): itu disimpan di kode aplikasi.
 */

/**
 * Apakah sebuah kunci benar-benar dikirim klien.
 *
 * Penting untuk PATCH: `body.photoMediaId ?? null` akan menghapus foto setiap
 * kali klien tidak mengirim kunci itu. Dengan pemeriksaan ini, field yang tidak
 * disebut berarti "jangan diubah", bukan "kosongkan".
 */
function has(body: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, key);
}

export function contentApi(cookies: Cookies) {
  const db = () => createSupabaseServerClient(cookies);

  return new Elysia({ prefix: '/api/admin' })

    // -----------------------------------------------------------------------
    // Profil Kepala Desa (singleton)
    // -----------------------------------------------------------------------
    .patch('/principal', async ({ request }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const name = required(body.name, 120);
      const greeting = required(body.greeting, 5000);
      const fields: Record<string, string> = {};
      if (!name) fields.name = 'Wajib diisi, maksimal 120 karakter.';
      if (!greeting) fields.greeting = 'Wajib diisi.';
      if (Object.keys(fields).length) return fail(422, 'validation_error', 'Periksa kembali isian.', fields);

      try {
        const patch: Record<string, unknown> = { name, greeting };
        if (has(body, 'photoMediaId')) patch.photo_media_id = body.photoMediaId ?? null;

        const { error } = await db().from('principal_profile').update(patch).eq('id', true);
        if (error) return serverError('PATCH /api/admin/principal', error);
        return ok({ updated: true });
      } catch (cause) {
        return serverError('PATCH /api/admin/principal', cause);
      }
    })

    // -----------------------------------------------------------------------
    // Pengaturan media situs (singleton): logo dan hero
    // -----------------------------------------------------------------------
    .patch('/settings', async ({ request }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      try {
        const patch: Record<string, unknown> = {};
        if (has(body, 'logoMediaId')) patch.logo_media_id = body.logoMediaId ?? null;
        if (has(body, 'heroMediaId')) patch.hero_media_id = body.heroMediaId ?? null;

        if (!Object.keys(patch).length) {
          return fail(422, 'validation_error', 'Tidak ada perubahan yang dikirim.');
        }

        const { error } = await db().from('site_settings').update(patch).eq('id', true);
        if (error) return serverError('PATCH /api/admin/settings', error);
        return ok({ updated: true });
      } catch (cause) {
        return serverError('PATCH /api/admin/settings', cause);
      }
    })

    // -----------------------------------------------------------------------
    // WhatsApp (singleton)
    // -----------------------------------------------------------------------
    .patch('/contact', async ({ request }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const phone = normalizePhone(String(body.phone ?? ''));
      if (!phone) {
        return fail(422, 'validation_error', 'Nomor tidak valid. Gunakan format 08xx atau 62xx.', {
          phone: 'Contoh: 081234567890'
        });
      }

      try {
        const { error } = await db().from('service_contacts')
          .update({ phone, message: required(body.message, 1000) ?? '' })
          .eq('id', true);
        if (error) return serverError('PATCH /api/admin/contact', error);
        return ok({ phone });
      } catch (cause) {
        return serverError('PATCH /api/admin/contact', cause);
      }
    })

    // -----------------------------------------------------------------------
    // Perangkat desa
    // -----------------------------------------------------------------------
    .post('/officials', async ({ request }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const name = required(body.name, 120);
      const role = required(body.role, 120);
      const fields: Record<string, string> = {};
      if (!name) fields.name = 'Wajib diisi.';
      if (!role) fields.role = 'Wajib diisi.';
      if (Object.keys(fields).length) return fail(422, 'validation_error', 'Periksa kembali isian.', fields);

      try {
        const { data, error } = await db().from('village_officials')
          .insert({
            name,
            role,
            education: required(body.education, 60),
            display_order: intOrZero(body.order),
            photo_media_id: body.photoMediaId ?? null
          })
          .select('id').single();
        if (error) return serverError('POST /api/admin/officials', error);
        return ok({ id: data.id }, 201);
      } catch (cause) {
        return serverError('POST /api/admin/officials', cause);
      }
    })

    .patch('/officials/:id', async ({ request, params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const name = required(body.name, 120);
      const role = required(body.role, 120);
      if (!name || !role) return fail(422, 'validation_error', 'Nama dan jabatan wajib diisi.');

      try {
        const patch: Record<string, unknown> = {
          name,
          role,
          education: required(body.education, 60),
          display_order: intOrZero(body.order)
        };
        if (has(body, 'photoMediaId')) patch.photo_media_id = body.photoMediaId ?? null;

        const { error } = await db().from('village_officials').update(patch).eq('id', params.id);
        if (error) return serverError('PATCH /api/admin/officials/:id', error);
        return ok({ updated: true });
      } catch (cause) {
        return serverError('PATCH /api/admin/officials/:id', cause);
      }
    })

    .delete('/officials/:id', async ({ params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      try {
        const { error } = await db().from('village_officials').delete().eq('id', params.id);
        if (error) return serverError('DELETE /api/admin/officials/:id', error);
        return ok({ deleted: true });
      } catch (cause) {
        return serverError('DELETE /api/admin/officials/:id', cause);
      }
    })

    // -----------------------------------------------------------------------
    // BPD
    // -----------------------------------------------------------------------
    .post('/bpd', async ({ request }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const name = required(body.name, 120);
      const role = required(body.role, 120);
      if (!name || !role) return fail(422, 'validation_error', 'Nama dan jabatan wajib diisi.');

      try {
        const { data, error } = await db().from('bpd_members')
          .insert({
            name,
            role,
            display_order: intOrZero(body.order),
            photo_media_id: body.photoMediaId ?? null
          })
          .select('id').single();
        if (error) return serverError('POST /api/admin/bpd', error);
        return ok({ id: data.id }, 201);
      } catch (cause) {
        return serverError('POST /api/admin/bpd', cause);
      }
    })

    .patch('/bpd/:id', async ({ request, params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const name = required(body.name, 120);
      const role = required(body.role, 120);
      if (!name || !role) return fail(422, 'validation_error', 'Nama dan jabatan wajib diisi.');

      try {
        const patch: Record<string, unknown> = {
          name,
          role,
          display_order: intOrZero(body.order)
        };
        if (has(body, 'photoMediaId')) patch.photo_media_id = body.photoMediaId ?? null;

        const { error } = await db().from('bpd_members').update(patch).eq('id', params.id);
        if (error) return serverError('PATCH /api/admin/bpd/:id', error);
        return ok({ updated: true });
      } catch (cause) {
        return serverError('PATCH /api/admin/bpd/:id', cause);
      }
    })

    .delete('/bpd/:id', async ({ params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      try {
        const { error } = await db().from('bpd_members').delete().eq('id', params.id);
        if (error) return serverError('DELETE /api/admin/bpd/:id', error);
        return ok({ deleted: true });
      } catch (cause) {
        return serverError('DELETE /api/admin/bpd/:id', cause);
      }
    })

    // -----------------------------------------------------------------------
    // Statistik 2026
    // -----------------------------------------------------------------------
    .patch('/statistics/:id', async ({ request, params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      // null berarti tidak tersedia, 0 berarti nol. Jangan disamakan.
      const value = numberOrNull(body.value);
      if (value !== null && value < 0) {
        return fail(422, 'validation_error', 'Nilai tidak boleh negatif.', { value: 'Tidak boleh negatif.' });
      }

      try {
        // Tahun tidak bisa diubah: constraint database juga menolak selain 2026.
        const { error } = await db().from('statistics')
          .update({ label: required(body.label, 120) ?? undefined, value })
          .eq('id', params.id);
        if (error) return serverError('PATCH /api/admin/statistics/:id', error);
        return ok({ updated: true });
      } catch (cause) {
        return serverError('PATCH /api/admin/statistics/:id', cause);
      }
    })

    // -----------------------------------------------------------------------
    // Fasilitas
    // -----------------------------------------------------------------------
    .post('/facilities', async ({ request }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const category = required(body.category, 120);
      const name = required(body.name, 180);
      const fields: Record<string, string> = {};
      if (!category) fields.category = 'Wajib diisi.';
      if (!name) fields.name = 'Wajib diisi.';
      if (Object.keys(fields).length) return fail(422, 'validation_error', 'Periksa kembali isian.', fields);

      try {
        const { data, error } = await db().from('facilities').insert({
          category, name,
          value: numberOrNull(body.value),
          unit: required(body.unit, 10) ?? 'unit',
          condition: required(body.condition, 60),
          note: required(body.note, 500),
          display_order: intOrZero(body.order),
          photo_media_id: body.photoMediaId ?? null
        }).select('id').single();
        if (error) return serverError('POST /api/admin/facilities', error);
        return ok({ id: data.id }, 201);
      } catch (cause) {
        return serverError('POST /api/admin/facilities', cause);
      }
    })

    .patch('/facilities/:id', async ({ request, params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const category = required(body.category, 120);
      const name = required(body.name, 180);
      if (!category || !name) return fail(422, 'validation_error', 'Kategori dan nama wajib diisi.');

      try {
        const patch: Record<string, unknown> = {
          category,
          name,
          value: numberOrNull(body.value),
          unit: required(body.unit, 10) ?? 'unit',
          condition: required(body.condition, 60),
          note: required(body.note, 500),
          display_order: intOrZero(body.order)
        };
        if (has(body, 'photoMediaId')) patch.photo_media_id = body.photoMediaId ?? null;

        const { error } = await db().from('facilities').update(patch).eq('id', params.id);
        if (error) return serverError('PATCH /api/admin/facilities/:id', error);
        return ok({ updated: true });
      } catch (cause) {
        return serverError('PATCH /api/admin/facilities/:id', cause);
      }
    })

    .delete('/facilities/:id', async ({ params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      try {
        const { error } = await db().from('facilities').delete().eq('id', params.id);
        if (error) return serverError('DELETE /api/admin/facilities/:id', error);
        return ok({ deleted: true });
      } catch (cause) {
        return serverError('DELETE /api/admin/facilities/:id', cause);
      }
    })

    // -----------------------------------------------------------------------
    // Keuangan 2026
    // -----------------------------------------------------------------------
    .post('/finance', async ({ request }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const category = required(body.category, 20);
      const name = required(body.name, 180);
      if (!['Pendapatan', 'Belanja'].includes(category ?? '')) {
        return fail(422, 'validation_error', 'Kategori harus Pendapatan atau Belanja.', {
          category: 'Pilih Pendapatan atau Belanja.'
        });
      }
      if (!name) return fail(422, 'validation_error', 'Uraian wajib diisi.', { name: 'Wajib diisi.' });

      try {
        // Tidak ada total/surplus/defisit yang dihitung di sini maupun di UI.
        const { data, error } = await db().from('financial_data').insert({
          category, name,
          value: numberOrNull(body.value),
          source_note: required(body.sourceNote, 300),
          display_order: intOrZero(body.order)
        }).select('id').single();
        if (error) return serverError('POST /api/admin/finance', error);
        return ok({ id: data.id }, 201);
      } catch (cause) {
        return serverError('POST /api/admin/finance', cause);
      }
    })

    .patch('/finance/:id', async ({ request, params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      const body = await readJson(request);
      if (!body) return fail(400, 'invalid_body', 'Permintaan tidak valid.');

      const category = required(body.category, 20);
      const name = required(body.name, 180);
      if (!['Pendapatan', 'Belanja'].includes(category ?? '')) {
        return fail(422, 'validation_error', 'Kategori harus Pendapatan atau Belanja.');
      }
      if (!name) return fail(422, 'validation_error', 'Uraian wajib diisi.', { name: 'Wajib diisi.' });

      try {
        const { error } = await db().from('financial_data').update({
          category,
          name,
          value: numberOrNull(body.value),
          source_note: required(body.sourceNote, 300),
          display_order: intOrZero(body.order)
        }).eq('id', params.id);
        if (error) return serverError('PATCH /api/admin/finance/:id', error);
        return ok({ updated: true });
      } catch (cause) {
        return serverError('PATCH /api/admin/finance/:id', cause);
      }
    })

    .delete('/finance/:id', async ({ params }) => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      try {
        const { error } = await db().from('financial_data').delete().eq('id', params.id);
        if (error) return serverError('DELETE /api/admin/finance/:id', error);
        return ok({ deleted: true });
      } catch (cause) {
        return serverError('DELETE /api/admin/finance/:id', cause);
      }
    })

    // -----------------------------------------------------------------------
    // Dashboard: ringkasan angka untuk halaman admin
    // -----------------------------------------------------------------------
    .get('/dashboard', async () => {
      const denied = await requireOperator(cookies);
      if (denied) return denied;

      try {
        const supabase = db();
        const [news, albums] = await Promise.all([
          supabase.from('news').select('id', { count: 'exact', head: true }),
          supabase.from('gallery_albums').select('id', { count: 'exact', head: true })
        ]);

        if (news.error) return serverError('GET /api/admin/dashboard (news)', news.error);
        if (albums.error) return serverError('GET /api/admin/dashboard (albums)', albums.error);

        return ok({ news: news.count ?? 0, albums: albums.count ?? 0, year: 2026 });
      } catch (cause) {
        return serverError('GET /api/admin/dashboard', cause);
      }
    });
}
