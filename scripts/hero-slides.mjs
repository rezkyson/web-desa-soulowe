import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: 'chromium' });
const checks = [];
const errors = [];

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');

  const group = page.getByRole('group', { name: 'Foto terbaru dari album galeri desa' });
  await group.waitFor();

  // Sources must come from the album mock, not a fixed hero file.
  const sources = await group.locator('img').evaluateAll(images => images.map(image => image.getAttribute('src')));
  assert(sources.length >= 4, `expected several album photos, got ${sources.length}`);
  for (const src of sources) {
    assert(/^\/images\/[a-z]+\.jpg$/.test(src), `unexpected hero slide source: ${src}`);
  }
  const uniqueSources = new Set(sources);
  assert.equal(uniqueSources.size, sources.length, 'duplicate photos in the slideshow');
  checks.push(`${sources.length} unique slides sourced from the newest albums`);

  // Order differs between loads because of client-side shuffling.
  const orders = new Set();
  for (let i = 0; i < 6; i++) {
    const fresh = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await fresh.goto(base);
    await fresh.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    orders.add((await fresh.getByRole('group', { name: 'Foto terbaru dari album galeri desa' }).locator('img').evaluateAll(images => images.map(image => image.getAttribute('src')))).join('|'));
    await fresh.close();
  }
  assert(orders.size > 1, 'slide order never changed across six loads');
  checks.push(`random order confirmed across loads (${orders.size} distinct sequences in 6)`);

  // Only one active image at a time.
  const activeCount = await group.locator('img.is-active').count();
  assert.equal(activeCount, 1);
  checks.push('exactly one active frame');

  // Autoplay advances.
  const indexOf = () => group.locator('img').evaluateAll(images => images.findIndex(image => image.classList.contains('is-active')));
  const first = await indexOf();
  await page.waitForTimeout(7000);
  const second = await indexOf();
  assert.notEqual(first, second, 'autoplay did not advance after the interval');
  checks.push('autoplay advances after the interval');

  // There is no play/pause control: the card runs continuously on its own.
  assert.equal(await group.getByRole('button', { name: /putar otomatis/i }).count(), 0);
  checks.push('no play/pause control, the slideshow is not visitor-stopped');

  // The active dot carries a progress fill that moves with the current frame.
  const fill = group.locator('.hero-slide-dot.is-active .hero-slide-fill');
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);
  const firstScale = await fill.evaluate(el => getComputedStyle(el).transform);
  await page.waitForTimeout(1200);
  const secondScale = await fill.evaluate(el => getComputedStyle(el).transform);
  assert.notEqual(firstScale, secondScale, 'progress fill did not advance');
  assert.equal(await group.locator('.hero-slide-fill').count(), 1, 'more than one progress fill');
  checks.push('active dot fills progressively with the current frame');

  // Dots jump to a specific frame and report state.
  await group.getByRole('button', { name: /Tampilkan foto 3/ }).click();
  assert.equal(await group.locator('.hero-slide-dot.is-active').count(), 1);
  assert.equal(await indexOf(), 2);
  checks.push('dot navigation selects a specific frame');

  // Hover holds the card without any visible control, so a photo can be read.
  await group.hover();
  const held = await indexOf();
  await page.waitForTimeout(6800);
  assert.equal(await indexOf(), held);
  checks.push('hover holds the frame so a visitor can look at a photo');

  // Keyboard reachable.
  await page.mouse.move(0, 0);
  await group.getByRole('button', { name: /Tampilkan foto 2/ }).focus();
  assert(await group.getByRole('button', { name: /Tampilkan foto 2/ }).evaluate(el => el === document.activeElement));
  checks.push('slide controls are keyboard focusable');

  // Reduced motion: no autoplay at all.
  const calm = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await calm.goto(base);
  await calm.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  const calmGroup = calm.getByRole('group', { name: 'Foto terbaru dari album galeri desa' });
  const calmIndex = () => calmGroup.locator('img').evaluateAll(images => images.findIndex(image => image.classList.contains('is-active')));
  const calmFirst = await calmIndex();
  await calm.waitForTimeout(7000);
  assert.equal(await calmIndex(), calmFirst, 'autoplay ran under reduced motion');
  assert.equal(await calmGroup.locator('.hero-slide-fill').first().isVisible().catch(() => false), false, 'progress fill visible under reduced motion');
  checks.push('reduced motion holds one still frame, no progress fill');
  await calm.close();

  // Mobile layout stays inside the viewport.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), 'hero slides overflow on mobile');
  const box = await page.getByRole('group', { name: 'Foto terbaru dari album galeri desa' }).boundingBox();
  assert(box.width <= 390 && box.height > 120);
  checks.push('mobile: no overflow, slideshow keeps a usable size');

  // Every photo has alt text describing an album photo.
  const alts = await group.locator('img').evaluateAll(images => images.map(image => image.getAttribute('alt')));
  for (const alt of alts) assert(alt && alt.length > 3 && !alt.includes('undefined'), `weak alt: ${alt}`);
  checks.push('all slides carry descriptive alt text');

  assert.deepEqual(errors, []);
  await writeFile('docs/hero-slides-results.json', JSON.stringify({ base, checkedAt: new Date().toISOString(), browser: 'Chromium', checks, errors, sources }, null, 2));
  console.log(`PASS: ${checks.length} hero slideshow checks.`);
} finally {
  await browser.close();
}
