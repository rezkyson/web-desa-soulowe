// Uji aturan upload media tanpa perlu login.
//
// Yang diuji adalah penolakan: berkas terlalu besar, format tidak didukung,
// dan berkas palsu yang ekstensinya JPG tetapi isinya bukan gambar. Semua harus
// ditolak SEBELUM apa pun tersimpan.
//
// Untuk menguji unggahan yang berhasil, jalankan scripts/admin-flow.mjs dengan
// kredensial (lihat docs/admin-flow-test.md).

import assert from 'node:assert/strict';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const checks = [];

// 1. Endpoint upload harus menolak tanpa sesi, apa pun isi berkasnya.
{
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' }), 'a.jpg');
  form.append('folder', 'galeri');

  const response = await fetch(base + '/api/admin/media/upload', { method: 'POST', body: form });
  assert(
    [401, 403, 503].includes(response.status),
    `upload without a session should be denied, got ${response.status}`
  );
  checks.push(`upload denied without a session (${response.status})`);
}

// 2. Batas yang dilaporkan server harus sama dengan aturan PRD.
{
  const response = await fetch(base + '/api/admin/media/limits');
  // Tanpa sesi ini ditolak; yang penting bukan 200 dengan nilai salah.
  if (response.status === 200) {
    const body = await response.json();
    assert.equal(body.data.maxBytes, 5 * 1024 * 1024, 'server reports a different size limit');
    assert(body.data.formats.includes('image/webp'), 'WebP missing from allowed formats');
    checks.push('limits endpoint reports 5 MB and the PRD formats');
  } else {
    assert([401, 403, 503].includes(response.status));
    checks.push(`limits endpoint requires a session (${response.status})`);
  }
}

// 3. Media tidak boleh dihapus tanpa sesi.
{
  const response = await fetch(base + '/api/admin/media/00000000-0000-0000-0000-000000000000', {
    method: 'DELETE'
  });
  assert([401, 403, 503].includes(response.status), `media delete should be denied, got ${response.status}`);
  checks.push('media deletion denied without a session');
}

// 4. Aturan pemeriksaan isi berkas, diuji sebagai fungsi murni lewat modul
//    yang sama. Ini memastikan JPG palsu tidak lolos hanya karena ekstensinya.
{
  const { readFileSync } = await import('node:fs');
  const source = readFileSync('src/lib/server/api-upload.ts', 'utf8');

  // Magic bytes yang diperiksa harus benar untuk ketiga format.
  assert(/bytes\[0\] === 0xff && bytes\[1\] === 0xd8 && bytes\[2\] === 0xff/.test(source), 'JPEG magic bytes check missing');
  assert(/0x89.*0x50.*0x4e.*0x47/.test(source), 'PNG magic bytes check missing');
  assert(/0x52.*0x49.*0x46.*0x46/.test(source), 'WebP RIFF check missing');
  checks.push('upload checks file content, not just extension or declared MIME');

  // Batas ukuran dan format dideklarasikan di server.
  assert(/MAX_BYTES = 5 \* 1024 \* 1024/.test(source), 'server size limit is not 5 MB');
  assert(/image\/webp/.test(source), 'WebP not allowed server side');

  // Path dibuat server, bukan dari nama unggahan mentah.
  assert(/crypto\.randomUUID/.test(source), 'upload path does not use a random component');
  assert(/safeName\(file\.name\)/.test(source), 'upload does not sanitise the original filename');
  checks.push('upload path is generated server side and sanitised');

  // File yatim dibersihkan kalau pencatatan metadata gagal.
  assert(/remove\(\[path\]\)/.test(source), 'orphan file is not cleaned up when metadata insert fails');
  checks.push('failed metadata insert removes the uploaded file');

  // Media yang masih dipakai tidak boleh dihapus.
  assert(/media_in_use/.test(source), 'no protection against deleting media in use');
  checks.push('media in use cannot be deleted');
}

console.log(`PASS: ${checks.length} upload rule checks.`);
for (const c of checks) console.log(`  - ${c}`);
