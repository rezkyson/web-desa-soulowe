import { chromium, devices } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const routes = [
  '/', '/profil', '/pemerintahan', '/data', '/keuangan',
  '/berita', '/galeri', '/layanan', '/kontak',
  '/berita/mengenal-pertanian-soulowe', '/galeri/lanskap-dan-suasana-desa'
];

// Legally required attribution text is exempt: it is not an action, and a
// 44px row would cover the map. Everything else must reach 44px.
const exempt = '.leaflet-control-attribution';

const browser = await chromium.launch({ channel: 'chromium' });
const checks = [];
const errors = [];

try {
  // A real touch device profile, so `pointer: coarse` rules actually apply.
  const context = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));

  const collect = () => page.evaluate(selector => {
    const out = [];
    for (const el of document.querySelectorAll('a,button')) {
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (box.width === 0 || box.height === 0) continue;
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      if (el.closest(selector)) continue;
      if (box.height < 44) {
        out.push({
          label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30),
          height: Math.round(box.height),
          className: String(el.className).split(' ')[0]
        });
      }
    }
    return out;
  }, exempt);

  const offenders = [];
  for (const route of routes) {
    await page.goto(base + route);
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    await page.waitForTimeout(200);
    const small = await collect();
    if (small.length) offenders.push({ route, small });
  }
  assert.deepEqual(offenders, [], `touch targets under 44px: ${JSON.stringify(offenders.slice(0, 3), null, 1)}`);
  checks.push(`${routes.length} public pages: every interactive target is at least 44px tall`);

  // The mobile menu toggle is the single most tapped control; confirm it too.
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  const toggle = await page.getByRole('button', { name: 'Buka navigasi', exact: true }).boundingBox();
  assert(toggle.height >= 44 && toggle.width >= 44, `menu toggle is ${toggle.width}x${toggle.height}`);
  checks.push(`menu toggle is ${Math.round(toggle.width)}x${Math.round(toggle.height)}`);

  // Slideshow dots must stay individually tappable without overlapping so much
  // that a tap lands on the wrong frame.
  const dots = await page.evaluate(() => {
    const all = [...document.querySelectorAll('.hero-slide-dot')];
    return all.map(dot => {
      const r = dot.getBoundingClientRect();
      return { cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2), h: Math.round(r.height) };
    });
  });
  assert(dots.length >= 3, `expected several slideshow dots, got ${dots.length}`);
  for (const dot of dots) assert(dot.h >= 44, `slideshow dot is ${dot.h}px tall`);
  for (let i = 0; i < dots.length; i++) {
    const hit = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      return el ? String(el.className) : null;
    }, { x: dots[i].cx, y: dots[i].cy });
    assert(hit?.includes('hero-slide-dot'), `dot ${i + 1} centre is covered by "${hit}"`);
  }
  checks.push(`${dots.length} slideshow dots: 44px tall and each centre hits its own dot`);

  // Enlarging hit areas must not introduce layout regressions.
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base);
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(overflow, false, `horizontal overflow at ${width}px`);
  }
  checks.push('320/390/768/1440px: no horizontal overflow');

  // The photo caption inside the hero card must not be pushed out by the taller
  // "Lihat lokasi" link.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  const card = await page.evaluate(() => {
    const figure = document.querySelector('.hero-card-figure');
    const body = document.querySelector('.hero-card-body');
    return { figure: Math.round(figure.getBoundingClientRect().height), body: Math.round(body.getBoundingClientRect().height) };
  });
  assert(card.figure > 100 && card.body > 90, `hero card collapsed: figure ${card.figure}, body ${card.body}`);
  checks.push(`hero card intact (photo ${card.figure}px, body ${card.body}px)`);

  assert.deepEqual(errors, []);
  await writeFile('docs/touch-target-results.json', JSON.stringify({
    base, checkedAt: new Date().toISOString(), browser: 'Chromium', device: 'Pixel 7', checks, errors
  }, null, 2));
  console.log(`PASS: ${checks.length} touch target checks.`);
} finally {
  await browser.close();
}
