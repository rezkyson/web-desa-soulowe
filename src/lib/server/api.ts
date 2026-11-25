import type { Cookies } from '@sveltejs/kit';

/**
 * Bentuk respons seragam untuk seluruh API, sesuai docs/frontend-contract.md.
 * UI tidak boleh mengubah error menjadi tampilan sukses.
 */
export type ApiResult<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string; fields?: Record<string, string> } };

export function ok<T>(data: T, status = 200): Response {
  return json({ data, error: null }, status);
}

export function fail(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>
): Response {
  return json({ data: null, error: { code, message, ...(fields ? { fields } : {}) } }, status);
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

/** Pesan error internal tidak boleh membocorkan detail database. */
export function serverError(context: string, cause: unknown): Response {
  // Konfigurasi yang belum lengkap bukan kesalahan server yang tak terduga:
  // itu keadaan "belum siap" dan harus dilaporkan sebagai 503, bukan 500.
  if (cause instanceof Error && /belum diisi/.test(cause.message)) {
    console.error(`[api] ${context}: konfigurasi belum lengkap`);
    return fail(503, 'unavailable', 'Layanan data belum dapat diakses. Coba lagi nanti.');
  }

  console.error(`[api] ${context}`, cause);
  return fail(500, 'internal_error', 'Terjadi kesalahan pada server. Coba lagi.');
}

/**
 * Slug dari judul: lowercase, hanya huruf/angka dan tanda hubung.
 * Deterministik supaya hasilnya bisa diprediksi dan diuji.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

/**
 * Slug unik: kalau sudah dipakai, tambahkan -2, -3, dan seterusnya.
 * Edit judul tidak mengubah slug yang sudah ada; pemanggil memutuskan itu.
 */
export async function uniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>
): Promise<string> {
  const root = slugify(base) || 'tanpa-judul';
  if (!(await exists(root))) return root;
  for (let i = 2; i < 100; i++) {
    const candidate = `${root}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error('tidak dapat menemukan slug unik');
}

/** Nomor WhatsApp Indonesia: 08.., 8.., 62.., +62.. menjadi 62.. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, '');
  let normalized = digits;
  if (normalized.startsWith('0')) normalized = `62${normalized.slice(1)}`;
  else if (normalized.startsWith('8')) normalized = `62${normalized}`;
  return /^62\d{8,13}$/.test(normalized) ? normalized : null;
}

/** Membaca body JSON dengan aman; body rusak bukan error 500. */
export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Trim dan ubah string kosong menjadi null, supaya field opsional konsisten. */
export function text(value: unknown, max = 180): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export function required(value: unknown, max = 180): string | null {
  const result = text(value, max);
  return result ?? null;
}

/** Angka nullable: null berarti tidak tersedia, bukan 0. */
export function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function intOrZero(value: unknown): number {
  const parsed = numberOrNull(value);
  return parsed === null ? 0 : Math.trunc(parsed);
}

/** Tanggal ISO YYYY-MM-DD yang valid, atau null. */
export function isoDate(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10) === value ? value : null;
}

export type { Cookies };
