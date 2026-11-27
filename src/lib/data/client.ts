import type { ApiEnvelope } from './types';

/**
 * Kesalahan API yang membawa kode dan status, bukan hanya pesan.
 *
 * UI perlu membedakan "belum ada data" dari "gagal memuat", dan "sesi habis"
 * dari "bukan operator". Kalau semuanya menjadi Error biasa, perbedaan itu
 * hilang dan halaman akhirnya menampilkan pesan yang salah.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fields?: Record<string, string>;

  constructor(code: string, message: string, status: number, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }

  /** Sesi tidak ada atau sudah berakhir. UI harus mengarahkan ke login. */
  get isUnauthorized() {
    return this.status === 401;
  }

  get isNotFound() {
    return this.status === 404;
  }
}

/**
 * Memanggil API aplikasi dari server (SSR) maupun klien.
 *
 * `fetchImpl` wajib diberikan saat dipanggil dari server, karena SvelteKit
 * menyediakan `event.fetch` yang meneruskan cookie sesi. Tanpa itu, pemanggilan
 * dari server akan kehilangan sesi operator.
 *
 * Body dikirim sebagai JSON. Untuk unggahan multipart, pakai `postForm`.
 */
export async function callApi<T>(
  path: string,
  options: RequestInit & { fetchImpl?: typeof fetch } = {}
): Promise<T> {
  const { fetchImpl = fetch, headers, ...rest } = options;

  const response = await fetchImpl(path, {
    ...rest,
    headers: {
      accept: 'application/json',
      ...(rest.body && typeof rest.body === 'string' ? { 'content-type': 'application/json' } : {}),
      ...(headers ?? {})
    }
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // Respons bukan JSON: biasanya halaman error HTML dari proxy atau runtime.
    throw new ApiError(
      'invalid_response',
      'Server mengirim jawaban yang tidak dikenali.',
      response.status
    );
  }

  if (!response.ok || payload.error) {
    const error = payload?.error;
    throw new ApiError(
      error?.code ?? 'unknown_error',
      error?.message ?? 'Terjadi kesalahan. Coba lagi.',
      response.status,
      error?.fields
    );
  }

  return payload.data;
}

/** Kirim body JSON. */
export function sendJson(
  path: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body?: unknown,
  fetchImpl?: typeof fetch
): Promise<unknown> {
  return callApi(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    fetchImpl
  });
}

/** Kirim multipart untuk unggahan berkas. */
export function postForm(
  path: string,
  form: FormData,
  fetchImpl?: typeof fetch
): Promise<unknown> {
  return callApi(path, { method: 'POST', body: form, fetchImpl });
}

/**
 * Pesan siap tampil untuk pengguna.
 *
 * Pesan dari server sudah berbahasa Indonesia dan tidak membocorkan detail
 * database, jadi dipakai apa adanya. Hanya kasus jaringan yang perlu
 * diterjemahkan sendiri.
 */
export function errorMessage(cause: unknown): string {
  if (cause instanceof ApiError) return cause.message;
  if (cause instanceof TypeError) {
    return 'Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.';
  }
  if (cause instanceof Error && cause.message) return cause.message;
  return 'Terjadi kesalahan. Coba lagi.';
}
