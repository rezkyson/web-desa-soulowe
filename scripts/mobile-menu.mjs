import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: 'chromium' });
const checks = [];
const errors = [];

// WCAG relative luminance and contrast, so the check measures the real colours
// instead of trusting the stylesheet to look right.
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
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', error => errors.push(error.message));

  // The home page is the risky case: its header is in overlay mode, so the
  // links are styled for the dark hero photo.
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await page.getByRole('button', { name: 'Buka navigasi', exact: true }).click();
  await page.getByRole('navigation', { name: 'Navigasi utama' }).waitFor();

  // The panel must be opaque from the first frame, not only after it settles.
  // A fade-in would briefly let the hero text show through the menu.
  const opaqueThroughout = await page.evaluate(async () => {
    const nav = document.querySelector('nav#navigasi-utama');
    const samples = [];
    for (let i = 0; i < 8; i++) {
      samples.push(Number(getComputedStyle(nav).opacity));
      await new Promise(r => requestAnimationFrame(r));
    }
    return Math.min(...samples);
  });
  assert.equal(opaqueThroughout, 1, `panel opacity dropped to ${opaqueThroughout} while opening`);
  checks.push('panel stays fully opaque while the open animation runs');

  const measured = await page.evaluate(() => {
    const nav = document.querySelector('nav#navigasi-utama');
    const panel = getComputedStyle(nav).backgroundColor;
    return {
      panel,
      links: [...nav.querySelectorAll('a')].map(a => ({
        text: a.textContent.trim(),
        color: getComputedStyle(a).color,
        own: getComputedStyle(a).backgroundColor
      }))
    };
  });

  // The panel itself must be opaque; a transparent panel over the hero photo
  // is exactly what made the white labels unreadable.
  const panelRgb = parse(measured.panel);
  assert.equal(measured.panel.includes('rgba(0, 0, 0, 0)'), false, 'panel background is transparent');
  checks.push(`panel is opaque (${measured.panel})`);

  for (const link of measured.links) {
    // A pill has its own background, so measure against that instead.
    const own = link.own.includes('rgba(0, 0, 0, 0)') ? null : parse(link.own);
    const bg = own ?? panelRgb;
    const ratio = contrast(parse(link.color), bg);
    assert(ratio >= 4.5, `"${link.text}" contrast ${ratio.toFixed(2)}:1 is below 4.5:1`);
    checks.push(`"${link.text}" ${ratio.toFixed(2)}:1`);
  }

  // The panel must stay inside the viewport and not need horizontal scrolling.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  assert.equal(overflow, false, 'mobile menu causes horizontal overflow');

  // Escape closes the panel and returns focus to the toggle.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  assert.equal(await page.getByRole('navigation', { name: 'Navigasi utama' }).isVisible(), false, 'Escape did not close the menu');
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  assert.equal(focused, 'Buka navigasi', `focus landed on ${focused}`);
  checks.push('Escape closes the panel and returns focus to the toggle');

  // A tall menu on a short screen must scroll inside the panel, not push the
  // page. 320x480 is smaller than anything tested before.
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await page.getByRole('button', { name: 'Buka navigasi', exact: true }).click();
  const panelBox = await page.getByRole('navigation', { name: 'Navigasi utama' }).boundingBox();
  assert(panelBox.height <= 480, `panel is ${panelBox.height}px tall on a 480px screen`);
  const scrollable = await page.getByRole('navigation', { name: 'Navigasi utama' }).evaluate(el => el.scrollHeight > el.clientHeight ? getComputedStyle(el).overflowY : 'fits');
  assert(['auto', 'scroll', 'fits'].includes(scrollable), `panel overflow is ${scrollable}`);
  checks.push(`320x480: panel ${Math.round(panelBox.height)}px tall, overflow ${scrollable}`);

  // The inner pages use the solid header, which must keep dark links too.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + '/profil');
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await page.getByRole('button', { name: 'Buka navigasi', exact: true }).click();
  const inner = await page.evaluate(() => {
    const nav = document.querySelector('nav#navigasi-utama');
    const bg = getComputedStyle(nav).backgroundColor;
    return { bg, color: getComputedStyle(nav.querySelector('a')).color };
  });
  assert(contrast(parse(inner.color), parse(inner.bg)) >= 4.5, 'inner page menu contrast failed');
  checks.push('inner page menu keeps readable links');

  assert.deepEqual(errors, []);
  await writeFile('docs/mobile-menu-results.json', JSON.stringify({
    base, checkedAt: new Date().toISOString(), browser: 'Chromium', checks, errors,
    measured: measured.links.map(l => l.text)
  }, null, 2));
  console.log(`PASS: ${checks.length} mobile menu checks.`);
} finally {
  await browser.close();
}
