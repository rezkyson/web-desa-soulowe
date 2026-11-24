import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: 'chromium' });
const checks = [];
const errors = [];
await mkdir('docs/screenshots/map', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  for (const [route, width] of [['/', 1440], ['/kontak', 390]]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + route);
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    const map = page.getByRole('region', { name: 'Peta lokasi Kantor Desa Soulowe' });
    await map.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const images = [...document.querySelectorAll('.office-map .leaflet-tile-loaded')];
      return images.length > 0 && images.every(image => image.complete && image.naturalWidth > 0);
    }, { timeout: 45000 });
    await page.getByText('Menyiapkan peta lokasi kantor…', { exact: true }).waitFor({ state: 'hidden' });
    await map.getByRole('button', { name: 'Kantor Desa Soulowe', exact: true }).waitFor();
    assert(await map.locator('.leaflet-popup-content').getByText('Kantor Desa Soulowe', { exact: true }).isVisible());
    assert.equal(await page.locator('.office-map-footer a').getAttribute('href'), 'https://maps.app.goo.gl/FSpoGorPZYV8kv8Y6');
    assert(await map.locator('.leaflet-control-attribution').getByRole('link', { name: 'OpenStreetMap' }).isVisible());
    await map.getByRole('button', { name: 'Zoom in', exact: true }).click();
    assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)));
    await page.evaluate(() => document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).forEach(animation => animation.finish()));
    await page.locator('.office-map').screenshot({ path: `docs/screenshots/map/${width}.png`, animations: 'disabled' });
    checks.push(`Real OSM tiles, office marker/popup, attribution, Google Maps link, zoom, no overflow: ${route} ${width}px`);
  }
  // Simulate unavailable external tiles: link and error message must survive.
  await page.route('https://*.tile.openstreetmap.org/**', route => route.abort());
  await page.goto(base + '/kontak');
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await page.locator('.map-tile-error').waitFor();
  assert(await page.locator('.office-map-footer a').isVisible());
  checks.push('Tile failure displays connection warning and retains external map link');
  const noJs = await browser.newPage({ javaScriptEnabled: false });
  await noJs.goto(base + '/kontak');
  assert.equal(await noJs.locator('.office-map-footer a').getAttribute('href'), 'https://maps.app.goo.gl/FSpoGorPZYV8kv8Y6');
  checks.push('No-JS fallback retains office Google Maps link');
  assert.deepEqual(errors, []);
  await writeFile('docs/map-results.json', JSON.stringify({ base, checkedAt: new Date().toISOString(), browser: 'Chromium', coordinates: [-1.0258227, 119.9240974], checks, errors }, null, 2));
  console.log(`PASS: ${checks.length} map checks.`);
} finally { await browser.close(); }
