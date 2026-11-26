import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: 'chromium' });
const checks = [];
const errors = [];

function luminance([r, g, b]) {
  const channel = v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
const parse = value => value.match(/\d+/g).slice(0, 3).map(Number);

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/admin/login');
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');

  // 1. Halaman login memakai API sungguhan, bukan simulasi.
  assert.equal(await page.locator('.demo-banner').count(), 0, 'demo banner is still shown');
  assert.equal(await page.getByText('Simulasikan gagal masuk').count(), 0, 'simulation checkbox still present');
  checks.push('login form talks to the real API, no simulation controls');

  // 2. Label form harus jelas dan tidak lagi menyebut "contoh".
  assert.equal(await page.getByLabel('Email', { exact: true }).count(), 1);
  assert.equal(await page.getByLabel('Password', { exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Masuk', exact: true }).count(), 1);
  checks.push('form has Email, Password and a single Masuk button');

  // 3. Judul panel kiri harus terbaca di atas latar gelap. Ini bug yang
  //    sebelumnya membuat kontras 1:1.
  const story = await page.evaluate(() => {
    const h1 = document.querySelector('.login-story h1');
    const panel = document.querySelector('.login-story');
    return {
      color: getComputedStyle(h1).color,
      background: getComputedStyle(panel).backgroundColor,
      text: h1.innerText
    };
  });
  const ratio = contrast(parse(story.color), parse(story.background));
  assert(ratio >= 4.5, `login heading contrast is ${ratio.toFixed(2)}:1`);
  checks.push(`login heading contrast ${ratio.toFixed(2)}:1`);

  // 4. Judul tidak boleh menempel antar baris saat melipat.
  assert(!/baikdimulai|daripengelolaan/.test(story.text), `heading words run together: ${story.text}`);
  checks.push('heading keeps spaces between lines');

  // 5. Login salah menampilkan pesan, bukan diam atau sukses.
  await page.getByLabel('Email', { exact: true }).fill('tidak-ada@contoh.id');
  await page.getByLabel('Password', { exact: true }).fill('salah-sekali');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();

  const alert = page.locator('[role=alert]');
  await alert.waitFor({ state: 'visible', timeout: 20000 });
  const message = (await alert.textContent())?.trim() ?? '';
  assert(message.length > 5, 'error message is empty');
  assert(/tidak sesuai|gagal|tidak dapat/i.test(message), `unexpected message: ${message}`);
  checks.push(`wrong password shows: "${message}"`);

  // 6. Setelah gagal, pengguna tidak dibawa ke dashboard.
  assert(page.url().includes('/admin/login'), `redirected away on failure: ${page.url()}`);
  checks.push('failed login stays on the login page');

  // 7. Pesan error harus terbaca (bukan abu-abu di atas abu-abu).
  const alertStyle = await alert.evaluate(el => ({
    color: getComputedStyle(el).color,
    background: getComputedStyle(el).backgroundColor
  }));
  const alertRatio = contrast(parse(alertStyle.color), parse(alertStyle.background));
  assert(alertRatio >= 4.5, `error message contrast is ${alertRatio.toFixed(2)}:1`);
  checks.push(`error message contrast ${alertRatio.toFixed(2)}:1`);

  // 8. Route admin tanpa sesi menampilkan ajakan masuk, bukan isi panel.
  await page.goto(base + '/admin');
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  const gate = await page.getByRole('heading', { name: /Sesi operator diperlukan/i }).count();
  assert.equal(gate, 1, 'admin page is not gated when there is no session');
  checks.push('admin routes are gated without a session');

  // 9. Mobile: tidak ada luber dan judul tetap utuh.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + '/admin/login');
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  assert.equal(overflow, false, 'login page overflows on mobile');
  const mobileText = await page.locator('.login-story h1').innerText();
  assert(!/baikdimulai|daripengelolaan/.test(mobileText), `mobile heading runs together: ${mobileText}`);
  checks.push('390px: no overflow, heading still readable');

  assert.deepEqual(errors, []);
  await writeFile('docs/login-page-results.json', JSON.stringify({
    base, checkedAt: new Date().toISOString(), browser: 'Chromium', checks, errors
  }, null, 2));
  console.log(`PASS: ${checks.length} login page checks.`);
  for (const c of checks) console.log(`  - ${c}`);
} finally {
  await browser.close();
}
