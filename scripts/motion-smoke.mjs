import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chromium', headless: true });
const checks = [];
const errors = [];
await mkdir('docs/screenshots/refinement', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await page.locator('.hero-media img').evaluate(async img => { await img.decode(); });
  const animation = await page.locator('.hero-media img').evaluate(img => {
    const a = img.getAnimations()[0];
    return a && { name: a.animationName, iterations: a.effect.getTiming().iterations };
  });
  assert.equal(animation?.name, 'hero-settle');
  assert.equal(animation.iterations, 1);
  checks.push('Hero animation exists and runs once, not a decorative loop');
  await page.locator('.hero-media img').evaluate(img => img.getAnimations().forEach(a => a.finish()));
  assert.equal(await page.locator('.news-feature-grid').evaluate(el => el.style.opacity), '0');
  await page.locator('.news-feature-grid').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.news-feature-grid')).opacity === '1');
  checks.push('Selected below-fold section reveals when scrolled into view');
  await page.locator('.location-section a').first().focus();
  assert.equal(await page.locator('.location-section').evaluate(el => el.style.opacity), '');
  checks.push('Keyboard focus immediately exposes content, no invisible focus trap');
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base);
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    // Actually scroll through one-time reveals before taking a full-page capture.
    await page.evaluate(async () => {
      for (const section of document.querySelectorAll('.public-main > section')) {
        section.scrollIntoView({ behavior: 'instant' });
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }
    });
    await page.locator('img').evaluateAll(async images => {
      images.forEach(img => img.loading = 'eager');
      await Promise.all(images.map(img => img.decode().catch(() => {})));
    });
    await page.waitForFunction(() => [...document.querySelectorAll('[data-reveal]')].every(el => el.dataset.reveal === 'shown'));
    await page.evaluate(() => document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).forEach(a => a.finish()));
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), `Overflow ${width}`);
    await page.screenshot({ path: `docs/screenshots/refinement/home-${width}.png`, fullPage: true, animations: 'disabled' });
  }
  checks.push('Rendered desktop/tablet/mobile, all reveals captured; no page overflow');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Profil Desa', exact: true }).click();
  await page.waitForURL('**/profil');
  await page.getByRole('heading', { name: 'Profil Desa', exact: true }).waitFor();
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Beranda', exact: true }).click();
  await page.waitForURL(base + '/');
  checks.push('Public navigation works with View Transition enhancement');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  assert.equal(await page.locator('.hero-media img').evaluate(img => getComputedStyle(img).animationName), 'none');
  assert(await page.locator('[data-reveal]').evaluateAll(nodes => nodes.every(el => el.dataset.reveal === 'shown')));
  // Leaflet may finish a near-zero-duration CSS transition after hydration.
  await page.waitForFunction(() => document.getAnimations().filter(a => a.playState === 'running').length === 0);
  checks.push('Reduced motion: no hero/reveal animation, all content visible');
  const noJs = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await noJs.goto(base);
  assert(await noJs.locator('.hero-lead h1').isVisible());
  assert.equal(await noJs.locator('.news-feature-grid').evaluate(el => getComputedStyle(el).opacity), '1');
  assert.equal(await noJs.locator('.location-section').evaluate(el => getComputedStyle(el).opacity), '1');
  checks.push('No-JS fallback keeps SSR content visible');
  assert.deepEqual(errors, []);
  await writeFile('docs/motion-results.json', JSON.stringify({ base, checkedAt: new Date().toISOString(), browser: 'Chromium', checks, errors }, null, 2));
  console.log(`PASS: ${checks.length} motion/refinement checks.`);
} finally { await browser.close(); }
