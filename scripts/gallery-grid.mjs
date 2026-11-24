import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const album = '/galeri/lanskap-dan-suasana-desa';
const browser = await chromium.launch({ channel: 'chromium' });
const checks = [];
const errors = [];

const measure = page => page.evaluate(() => {
  const grid = document.querySelector('.photo-grid');
  const styles = getComputedStyle(grid);
  const buttons = [...grid.querySelectorAll('button')];
  return {
    columns: styles.gridTemplateColumns.split(' ').length,
    gap: styles.gap,
    items: buttons.map(button => {
      const box = button.getBoundingClientRect();
      const img = button.querySelector('img');
      const imgBox = img.getBoundingClientRect();
      return {
        width: Math.round(box.width),
        height: Math.round(box.height),
        imgHeight: Math.round(imgBox.height),
        natural: `${img.naturalWidth}x${img.naturalHeight}`,
        fit: getComputedStyle(img).objectFit
      };
    })
  };
});

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + album);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await page.locator('.photo-grid button img').first().evaluate(img => img.decode().catch(() => {}));

  // The original bug: width/height attributes forced every photo to 700px tall
  // inside a 169px column, so each image became a tall strip.
  const mobile = await measure(page);
  assert.equal(mobile.columns, 2, `expected 2 columns on 390px, got ${mobile.columns}`);
  for (const item of mobile.items) {
    assert(item.height <= 260, `photo is ${item.height}px tall on mobile, it should stay near its 4:3 box`);
    assert.equal(item.imgHeight, item.height, 'image height does not match its frame, so it is being stretched');
    const ratio = item.width / item.height;
    assert(Math.abs(ratio - 4 / 3) < 0.08, `frame ratio ${ratio.toFixed(2)} is not 4:3`);
    assert.equal(item.fit, 'cover');
  }
  const heights = new Set(mobile.items.map(i => i.height));
  assert.equal(heights.size, 1, `photos have different heights: ${[...heights].join(', ')}`);
  checks.push(`390px: 2 columns, every frame ${mobile.items[0].width}x${mobile.items[0].height}, ratio 4:3`);

  // Nothing may spill sideways at the narrowest width we support.
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + album);
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(overflow, false, `gallery detail overflows at ${width}px`);
    const data = await measure(page);
    assert(data.columns === (width <= 640 ? 2 : 3), `wrong column count at ${width}px: ${data.columns}`);
    const unique = new Set(data.items.map(i => i.height));
    assert.equal(unique.size, 1, `uneven photo heights at ${width}px`);
  }
  checks.push('320/390/768/1440px: no overflow, 2 then 3 columns, even heights');

  // The photos must not be cropped beyond recognition: a landscape shot keeps
  // most of its width visible, which is what "rapi" means here.
  const crop = await page.evaluate(() => {
    const img = document.querySelector('.photo-grid img');
    const box = img.getBoundingClientRect();
    return { shown: box.width / box.height, natural: img.naturalWidth / img.naturalHeight };
  });
  assert(crop.shown > crop.natural * 0.4, `photo shows only ${(crop.shown / crop.natural * 100).toFixed(0)}% of its width`);
  checks.push('landscape photos keep a usable crop');

  // Keyboard and lightbox still work after the layout change.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + album);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  const first = page.locator('.photo-grid button').first();
  await first.focus();
  assert(await first.evaluate(el => el === document.activeElement), 'photo button is not keyboard focusable');
  await first.press('Enter');
  await page.locator('dialog[open]').waitFor();
  const lightbox = await page.evaluate(() => {
    const img = document.querySelector('dialog[open] img');
    const box = img.getBoundingClientRect();
    return { shown: box.width / box.height, natural: img.naturalWidth / img.naturalHeight };
  });
  assert(Math.abs(lightbox.shown - lightbox.natural) < 0.15, 'lightbox distorts the photo');
  checks.push('keyboard opens the lightbox and the full photo is not distorted');
  await page.keyboard.press('Escape');

  assert.deepEqual(errors, []);
  await writeFile('docs/gallery-grid-results.json', JSON.stringify({
    base, checkedAt: new Date().toISOString(), browser: 'Chromium', checks, errors
  }, null, 2));
  console.log(`PASS: ${checks.length} gallery grid checks.`);
} finally {
  await browser.close();
}
