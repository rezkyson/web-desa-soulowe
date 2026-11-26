import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: 'chromium' });
const results = [];
const errors = [];
const record = (control, outcome) => {
  results.push(`${control} -> ${outcome}`);
  console.log(`ok ${results.length}: ${control}`);
};

// View-transition snapshots swallow clicks while animating; wait them out so the
// script fails only on real regressions, not on animation timing.
async function settle(page) {
  await page.waitForFunction(() => {
    const running = document.getAnimations().filter(animation => {
      const pseudo = animation.effect?.pseudoElement ?? '';
      return pseudo.includes('view-transition') && animation.playState !== 'finished' && animation.playState !== 'idle';
    });
    return running.length === 0;
  }, undefined, { timeout: 5000 });
}

async function visit(page, path) {
  await page.goto(base + path);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await settle(page);
}

// Client-side navigation under a View Transition does not always fire the
// "load" event Playwright's waitForURL listens for, so poll the URL instead.
async function expectPath(page, path) {
  await page.waitForFunction(expected => location.pathname === expected, path, { timeout: 15000 });
  await settle(page);
}

// The view-transition overlay can swallow a click that lands mid-animation.
// Click, and retry once only if nothing navigated, so a real dead link still fails.
async function clickTo(page, locator, path) {
  await locator.scrollIntoViewIfNeeded();
  await locator.click();
  try {
    await page.waitForFunction(expected => location.pathname === expected, path, { timeout: 8000 });
  } catch {
    await settle(page);
    await locator.click();
    await page.waitForFunction(expected => location.pathname === expected, path, { timeout: 8000 });
  }
  await settle(page);
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));

  // Hero primary action.
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await settle(page);
  await page.getByRole('link', { name: 'Kenali desa kami' }).click();
  await expectPath(page, '/profil');
  await page.waitForFunction(() => document.querySelector('h1')?.textContent?.trim() === 'Profil Desa');
  record('Hero: Kenali desa kami', '/profil with h1 Profil Desa');

  // Hero scroll cue is an in-page anchor to an existing section.
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await settle(page);
  await page.getByRole('link', { name: 'Lanjut ke bagian tentang desa' }).click();
  await page.waitForFunction(() => location.hash === '#tentang');
  assert(await page.locator('#tentang').isVisible());
  record('Hero: scroll cue', '#tentang section reached');

  // Hero glass card action.
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await settle(page);
  await page.getByRole('link', { name: /Lihat lokasi/ }).first().click();
  await expectPath(page, '/kontak');
  record('Hero card: Lihat lokasi', '/kontak');

  // Hero service links.
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await settle(page);
  const wa = page.getByLabel('Hubungi desa lewat WhatsApp');
  assert.match(await wa.getAttribute('href'), /^https:\/\/wa\.me\/62\d+\?text=/);
  const popup = page.context().waitForEvent('page');
  await wa.click();
  await (await popup).close();
  record('Hero: WhatsApp', 'opens wa.me/62... with prefilled text');
  await page.getByLabel('Lihat lokasi kantor desa').click();
  await expectPath(page, '/kontak');
  record('Hero: map pin link', '/kontak');
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await settle(page);
  await page.getByLabel('Buka galeri desa').click();
  await expectPath(page, '/galeri');
  record('Hero: gallery link', '/galeri');

  // Header navigation: every item resolves.
  for (const [label, path] of [['Beranda', '/'], ['Profil Desa', '/profil'], ['Pemerintahan', '/pemerintahan'], ['Data Desa', '/data'], ['Keuangan', '/keuangan'], ['Berita', '/berita'], ['Galeri', '/galeri'], ['Hubungi desa', '/kontak']]) {
    await page.goto(base);
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    await settle(page);
    await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: label, exact: true }).click();
    await expectPath(page, path);
    const status = await page.locator('h1').first().isVisible();
    assert(status, `h1 missing on ${path}`);
    record(`Nav: ${label}`, `${path} with visible h1`);
  }

  // Home sections that promise data.
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await settle(page);
  await page.getByRole('link', { name: 'Data lengkap' }).click();
  await expectPath(page, '/data');
  record('Data band: Data lengkap', '/data');

  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await settle(page);
  await page.locator('.info-panel-links').getByRole('link', { name: /Pemerintahan Desa/ }).click();
  await expectPath(page, '/pemerintahan');
  record('Info panel: Pemerintahan Desa', '/pemerintahan');
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await settle(page);
  await page.locator('.info-panel-links').getByRole('link', { name: /Data Desa/ }).click();
  await expectPath(page, '/data');
  record('Info panel: Data Desa', '/data');
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await settle(page);
  await page.locator('.info-panel-links').getByRole('link', { name: /Keuangan Desa/ }).click();
  await expectPath(page, '/keuangan');
  record('Info panel: Keuangan Desa', '/keuangan');

  // Featured story and side rows.
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await settle(page);
  await clickTo(page, page.locator('.news-feature').getByRole('link', { name: 'Baca berita' }), '/berita/mengenal-pertanian-soulowe');
  record('Featured news: Baca berita', 'detail page');
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await settle(page);
  await clickTo(page, page.locator('.news-row').first().getByRole('link').last(), '/berita/informasi-desa-untuk-masyarakat');
  record('Side news row', 'detail page');

  // Gallery tiles.
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await settle(page);
  await clickTo(page, page.locator('.gallery-tile').first(), '/galeri/lanskap-dan-suasana-desa');
  record('Gallery tile', 'album detail');

  // Footer links.
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await settle(page);
  await page.locator('.public-footer').getByRole('link', { name: 'Masuk Operator' }).click();
  await expectPath(page, '/admin/login');
  record('Footer: Masuk Operator', '/admin/login');

  // Panel admin sekarang dijaga sesi operator sungguhan. Alur tulis dengan
  // sesi nyata diuji di scripts/admin-flow.mjs (butuh kredensial), jadi di sini
  // hanya diperiksa bahwa gerbang sesi dan penolakan login bekerja.
  await expectPath(page, '/admin/login');
  await page.getByLabel('Email', { exact: true }).fill('tidak-ada@contoh.id');
  await page.getByLabel('Password', { exact: true }).fill('salah-sekali');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await page.locator('[role=alert]').waitFor({ state: 'visible', timeout: 20000 });
  record('Admin login: wrong credentials', 'error shown, stays on login');
  await page.goto(base + '/admin');
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await page.getByRole('heading', { name: /Sesi operator diperlukan/i }).waitFor();
  record('Admin gate', 'requires operator session');

  // Mobile menu open/close and Escape behaviour on the dialog.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await settle(page);
  await page.getByRole('button', { name: 'Buka navigasi', exact: true }).click();
  assert(await page.getByRole('navigation', { name: 'Navigasi utama' }).isVisible());
  await page.getByRole('button', { name: 'Tutup navigasi', exact: true }).click();
  assert(!(await page.getByRole('navigation', { name: 'Navigasi utama' }).isVisible()));
  record('Mobile menu', 'opens and closes');

  // Keyboard: tab reaches hero action, focus visible.
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await settle(page);
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim());
  assert.equal(first, 'Lewati ke konten');
  record('Keyboard', 'first Tab reaches skip link');

  // Map dialog-free zoom control.
  await page.goto(base + '/kontak');
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await page.getByRole('region', { name: 'Peta lokasi Kantor Desa Soulowe' }).getByRole('button', { name: 'Zoom in' }).click();
  record('Map: zoom in', 'click accepted');

  assert.deepEqual(errors, [], 'Console page errors');
  await writeFile('docs/clickthrough-v2.md', [
    '# Click-through verification (antislop R-35)',
    '',
    `Base: ${base}`,
    `Date: ${new Date().toISOString()}`,
    '',
    ...results.map(line => `- ${line}`),
    '',
    `Console page errors: ${errors.length === 0 ? 'none' : errors.join('; ')}`,
    ''
  ].join('\n'));
  console.log(`PASS: ${results.length} controls clicked with observable outcomes, 0 console errors.`);
} finally {
  await browser.close();
}
