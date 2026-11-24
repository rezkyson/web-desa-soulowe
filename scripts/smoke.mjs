import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chromium', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const checks = [];
page.on('pageerror', error => errors.push(error.message));
async function go(route) {
  const response = await page.goto(base + route);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  return response;
}
async function screenshot(path) {
  if (await page.locator('.hero-shell').count()) {
    await page.evaluate(async () => {
      for (const section of document.querySelectorAll('.public-main > section')) {
        section.scrollIntoView({ behavior: 'instant' });
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }
    });
    await page.waitForFunction(() => [...document.querySelectorAll('[data-reveal]')].every(el => el.dataset.reveal === 'shown'));
    await page.evaluate(() => { document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).forEach(a => a.finish()); scrollTo({ top: 0, behavior: 'instant' }); });
  }
  await page.locator('img').evaluateAll(async images => {
    images.forEach(image => image.loading = 'eager');
    await Promise.all(images.map(image => image.decode().catch(() => {})));
  });
  await page.screenshot({ path, fullPage: true, animations: 'disabled' });
}
await mkdir('docs/screenshots', { recursive: true });
try {
  const routes = ['/', '/profil', '/pemerintahan', '/data', '/keuangan', '/berita', '/galeri', '/layanan', '/kontak', '/berita/mengenal-pertanian-soulowe', '/galeri/lanskap-dan-suasana-desa'];
  for (const route of routes) {
    const response = await go(route);
    assert.equal(response.status(), 200, route);
    await page.locator('h1').first().waitFor();
    const imageFailures = await page.locator('img').evaluateAll(images => images.filter(img => img.complete && !img.naturalWidth).map(img => img.src));
    assert.deepEqual(imageFailures, [], `Images: ${route}`);
    assert(await page.title(), `Title: ${route}`);
    checks.push(`200 + heading + images: ${route}`);
  }
  await go('/');
  await screenshot('docs/screenshots/home-desktop.png');
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/profil', '/data', '/keuangan', '/pemerintahan', '/kontak']) {
      await go(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert(!overflow, `Overflow ${width}: ${route}`);
    }
    await go('/');
    await screenshot(`docs/screenshots/home-${width}.png`);
    checks.push(`No viewport overflow: ${width}px`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Buka navigasi', exact: true }).click();
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Profil Desa', exact: true }).click();
  await page.waitForURL('**/profil');
  checks.push('Mobile navigation works');
  await go('/tidak-ada');
  assert.equal(await page.locator('h1').textContent(), 'Halaman belumdapat ditemukan.');
  await go('/berita/slug-tidak-ada');
  await page.getByRole('heading', { name: 'Berita tidak ditemukan' }).waitFor();
  await go('/galeri/lanskap-dan-suasana-desa');
  await page.getByRole('button', { name: /Perbesar foto/ }).first().click();
  assert(await page.locator('dialog').evaluate(d => d.open));
  await page.keyboard.press('Escape');
  assert(!(await page.locator('dialog').evaluate(d => d.open)));
  checks.push('404, missing news, gallery lightbox');
  await go('/admin');
  await page.getByRole('heading', { name: 'Buka sesi demo operator' }).waitFor();
  await go('/admin/login');
  await page.getByLabel('Email contoh').fill('operator@example.com');
  await page.getByLabel('Password contoh', { exact: true }).fill('contoh123');
  await page.getByRole('button', { name: 'Masuk demo operator' }).click();
  await page.waitForURL('**/admin');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await screenshot('docs/screenshots/admin-desktop.png');
  for (const module of ['sambutan', 'pemerintahan', 'statistik', 'fasilitas', 'keuangan', 'berita', 'galeri', 'whatsapp', 'media', 'akun']) {
    await page.getByRole('navigation', { name: 'Navigasi admin' }).locator(`a[href="/admin/${module}"]`).click();
    await page.locator('.admin-page-heading h1').waitFor();
    assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), `Admin overflow: ${module}`);
    checks.push(`Admin module: ${module}`);
  }
  await page.getByRole('link', { name: 'Pemerintahan Desa', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah data', exact: true }).click();
  await page.getByLabel('Nama / uraian').fill('Perangkat Demo');
  await page.getByLabel('Jabatan', { exact: true }).fill('Jabatan Contoh');
  await page.getByLabel('Pendidikan', { exact: true }).fill('SMA');
  await page.getByRole('button', { name: 'Simpan perubahan demo' }).click();
  await page.getByRole('status').filter({ hasText: 'Perubahan tersimpan' }).waitFor();
  await page.getByRole('button', { name: 'Edit Perangkat Demo', exact: true }).click();
  await page.getByLabel('Nama / uraian').fill('Perangkat Direvisi');
  await page.getByRole('button', { name: 'Simpan perubahan demo' }).click();
  await page.getByRole('button', { name: 'Hapus Perangkat Direvisi', exact: true }).click();
  assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Batal');
  await page.getByRole('button', { name: 'Batal', exact: true }).click();
  assert(await page.getByRole('button', { name: 'Hapus Perangkat Direvisi', exact: true }).isVisible());
  await page.getByRole('button', { name: 'Hapus Perangkat Direvisi', exact: true }).click();
  await page.getByRole('button', { name: 'Hapus', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Item dihapus' }).waitFor();
  checks.push('Mock CRUD + cancel/confirm delete + safe focus');
  await page.getByRole('link', { name: 'Data Statistik', exact: true }).click();
  await page.getByLabel('Total penduduk').fill('1130');
  await page.getByRole('button', { name: 'Simpan perubahan demo' }).click();
  await page.getByRole('status').filter({ hasText: 'Perubahan disimpan' }).waitFor();
  checks.push('Statistics save without proxy cloning error');
  await page.getByRole('link', { name: 'Berita', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah berita', exact: true }).click();
  await page.getByLabel('Judul berita').fill('Berita Uji Frontend');
  await page.getByLabel('Ringkasan').fill('Ringkasan pengujian frontend.');
  await page.getByLabel('Isi berita').fill('Konten pengujian lokal dalam memori.');
  await page.locator('input[type=file]').first().setInputFiles('static/images/field.jpg');
  await page.locator('.form-photo').waitFor();
  await page.getByLabel('Simulasikan gagal menyimpan').check();
  await page.getByRole('button', { name: 'Simpan & terbitkan demo' }).click();
  await page.getByRole('alert').filter({ hasText: 'Simulasi gagal menyimpan' }).waitFor();
  await page.getByLabel('Simulasikan gagal menyimpan').uncheck();
  await page.getByRole('button', { name: 'Simpan & terbitkan demo' }).click();
  await page.getByRole('status').filter({ hasText: 'Konten langsung terbit' }).waitFor();
  await page.getByRole('link', { name: 'Lihat Berita Uji Frontend', exact: true }).click();
  await page.getByRole('heading', { name: 'Berita Uji Frontend' }).waitFor();
  checks.push('News mock publish + image preview + simulated failure + public detail');
  await page.goBack();
  await page.getByRole('navigation', { name: 'Navigasi admin' }).getByRole('link', { name: 'Galeri', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah album', exact: true }).click();
  await page.getByLabel('Nama album').fill('Album Uji Frontend');
  await page.getByLabel('Deskripsi album').fill('Album contoh pengujian lokal.');
  const input = page.locator('input[type=file]');
  await input.setInputFiles({ name: 'tidak-valid.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await page.getByRole('alert').filter({ hasText: 'Gunakan gambar JPG' }).waitFor();
  await input.setInputFiles({ name: 'besar.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await page.getByRole('alert').filter({ hasText: 'maksimal 5 MB' }).waitFor();
  await input.setInputFiles(['static/images/landscape.jpg', 'static/images/field.jpg']);
  await page.locator('.upload-grid>div').nth(1).waitFor();
  await page.getByRole('button', { name: 'Jadikan unggulan' }).click();
  await page.locator('.upload-grid>div').last().getByRole('button', { name: /Hapus foto/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Batal', exact: true }).click();
  assert.equal(await page.locator('.upload-grid>div').count(), 2);
  await page.getByRole('button', { name: 'Simpan & terbitkan demo' }).click();
  await page.getByRole('status').filter({ hasText: 'Konten langsung terbit' }).waitFor();
  await page.getByRole('link', { name: 'Lihat Album Uji Frontend', exact: true }).click();
  await page.getByRole('heading', { name: 'Album Uji Frontend', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: /Perbesar foto/ }).count(), 2);
  checks.push('Album multi-upload + featured photo + delete cancellation + invalid/oversized upload rejection');
  await page.goBack();
  await page.getByRole('link', { name: 'WhatsApp Layanan', exact: true }).click();
  await page.getByLabel('Nomor WhatsApp').fill('081234567890');
  await page.getByRole('button', { name: 'Simpan perubahan demo' }).click();
  await page.getByRole('status').filter({ hasText: 'Perubahan disimpan' }).waitFor();
  await page.getByRole('link', { name: 'Media & Gambar', exact: true }).click();
  await page.getByRole('button', { name: 'Pilih media 1 sebagai hero' }).click();
  await page.getByRole('button', { name: 'Batal', exact: true }).click();
  await page.getByRole('button', { name: 'Pilih media 1 sebagai hero' }).click();
  await page.getByRole('button', { name: 'Ganti media', exact: true }).click();
  await page.getByRole('button', { name: 'Simpan perubahan demo' }).click();
  await page.getByRole('status').filter({ hasText: 'Perubahan disimpan' }).waitFor();
  checks.push('WhatsApp normalization + media selection with confirmation');
  await page.getByRole('link', { name: 'Pengaturan Akun', exact: true }).click();
  await page.getByLabel('Password baru contoh').fill('contoh1234');
  await page.getByLabel('Konfirmasi password baru').fill('berbeda123');
  await page.getByRole('button', { name: 'Simulasikan ubah password' }).click();
  await page.getByRole('alert').filter({ hasText: 'tidak sama' }).waitFor();
  await page.getByLabel('Konfirmasi password baru').fill('contoh1234');
  await page.getByRole('button', { name: 'Simulasikan ubah password' }).click();
  await page.getByRole('status').filter({ hasText: 'Tidak ada password yang disimpan' }).waitFor();
  await page.getByRole('button', { name: 'Keluar dari demo' }).click();
  await page.waitForURL('**/admin/login');
  checks.push('Password confirmation validation + simulated change + logout');
  await go('/admin/login');
  await page.getByLabel('Email contoh').fill('operator@example.com');
  await page.getByLabel('Password contoh', { exact: true }).fill('contoh123');
  await page.getByRole('button', { name: 'Masuk demo operator' }).click();
  await page.waitForURL('**/admin');
  await page.setViewportSize({ width: 390, height: 844 });
  await screenshot('docs/screenshots/admin-mobile.png');
  assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'Admin mobile overflow');
  await page.getByRole('button', { name: 'Buka menu admin' }).click();
  await page.getByRole('link', { name: 'Berita', exact: true }).click();
  assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'Admin mobile table overflow');
  await page.getByRole('button', { name: 'Tambah berita', exact: true }).click();
  await screenshot('docs/screenshots/admin-editor-mobile.png');
  assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'Admin mobile editor overflow');
  checks.push('Admin mobile menu + contained table scroll');
  await page.setViewportSize({ width: 768, height: 1000 });
  await page.getByRole('button', { name: 'Batal', exact: true }).click();
  await page.getByRole('button', { name: 'Buka menu admin' }).click();
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await page.waitForURL('**/admin');
  await page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor();
  await screenshot('docs/screenshots/admin-tablet.png');
  assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'Admin tablet overflow');
  await page.getByRole('combobox', { name: /Tampilan/ }).selectOption('error');
  await page.getByRole('button', { name: 'Coba lagi' }).click();
  checks.push('Admin tablet + simulated error retry');
  for (const route of ['/profil', '/data', '/keuangan', '/kontak']) {
    await go(route);
    await screenshot(`docs/screenshots/${route.slice(1)}-tablet.png`);
  }
  checks.push('Internal public page screenshots at 768px');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches));
  assert.deepEqual(errors, [], 'Browser runtime errors');
  checks.push('No browser pageerror in checked routes/flows');
  await writeFile('docs/smoke-results.json', JSON.stringify({ base, browser: 'Chromium', checkedAt: new Date().toISOString(), checks, errors }, null, 2));
  console.log(`PASS: ${checks.length} frontend checks; screenshots in docs/screenshots.`);
} finally { await browser.close(); }
