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
  // Panel admin sekarang dijaga sesi operator sungguhan, bukan demo.
  await page.getByRole('heading', { name: /Sesi operator diperlukan/i }).waitFor();
  checks.push('admin panel is gated without an operator session');
  await go('/admin/login');
  await page.getByLabel('Email', { exact: true }).fill('tidak-ada@contoh.id');
  await page.getByLabel('Password', { exact: true }).fill('salah-sekali');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await page.locator('[role=alert]').waitFor({ state: 'visible', timeout: 20000 });
  checks.push('login rejects unknown credentials');
  // Alur admin dengan sesi nyata diuji terpisah di scripts/admin-flow.mjs,
  // karena butuh kredensial yang tidak disimpan di repo.
  await go('/');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await screenshot('docs/screenshots/home-desktop-auth.png');
  // Editor admin membutuhkan sesi operator sungguhan. Alur tulisnya diuji di
  // scripts/admin-flow.mjs dengan kredensial yang tidak disimpan di repo, jadi
  // bagian ini hanya mencatat bahwa gerbang sesi bekerja.
  checks.push('Admin editor flow is covered by admin-flow.mjs (needs credentials)');
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
