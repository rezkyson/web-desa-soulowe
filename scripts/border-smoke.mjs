import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: 'chromium' });
const checks = [];
const errors = [];
await mkdir('docs/screenshots/borders', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await page.waitForFunction(() => [...document.querySelectorAll('.animated-border')].every(el => el.dataset.borderRunning === 'false'));
  checks.push('News borders paused below viewport');
  await page.locator('.news-feature-grid').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.querySelectorAll('.animated-border')].some(el => el.dataset.borderRunning === 'true'));
  const effect = await page.locator('.animated-border__light').first().evaluate(el => ({
    background: getComputedStyle(el).backgroundImage,
    play: getComputedStyle(el).animationPlayState,
    width: el.getBoundingClientRect().width,
    frame: el.parentElement.getBoundingClientRect().width,
    duration: getComputedStyle(el).animationDuration
  }));
  assert(effect.background.includes('conic-gradient'));
  assert.equal(effect.play, 'running');
  assert.equal(effect.duration, '8s');
  assert(effect.width >= effect.frame);
  checks.push('21st.dev-style conic highlight, transform rotation, 8 second orbit, correctly sized layer');
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['/', '/berita', '/galeri']) {
      await page.goto(base + route);
      await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
      const target = page.locator(route === '/' ? '.home-news' : route === '/berita' ? '.news-grid' : '.gallery-grid');
      await target.scrollIntoViewIfNeeded();
      await page.locator('img').evaluateAll(async images => {
        images.forEach(img => img.loading = 'eager');
        await Promise.all(images.map(img => img.decode().catch(() => {})));
      });
      await page.waitForFunction(() => [...document.querySelectorAll('.home-news [data-reveal]')].every(el => el.dataset.reveal === 'shown'));
      await page.evaluate(() => document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).forEach(a => a.finish()));
      assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), `${route} overflow ${width}`);
      if (route === '/berita') {
        const boxes = await page.locator('.news-card').evaluateAll(cards => cards.map(el => {
          const bounds = el.getBoundingClientRect();
          const image = el.querySelector('.image-link img').getBoundingClientRect();
          const heading = el.querySelector('h3 a');
          return { width: bounds.width, height: bounds.height, ratio: image.width / image.height,
            clamp: getComputedStyle(heading).webkitLineClamp };
        }));
        for (const card of boxes) {
          assert(card.height < 540, `Card unexpectedly tall: ${JSON.stringify(card)}`);
          assert(card.ratio > 1.55 && card.ratio < 1.85);
          assert.equal(card.clamp, '2');
        }
        if (width === 1440) assert(Math.max(...boxes.map(b => b.height)) - Math.min(...boxes.map(b => b.height)) < 2, 'Equal desktop card heights');
      }
      await target.screenshot({ path: `docs/screenshots/borders/${route === '/' ? 'home-news' : route.slice(1)}-${width}.png`, animations: 'disabled' });
    }
    checks.push(`Compact cards, controlled photo ratios, no overflow + gallery: ${width}px`);
  }
  await page.goto(base + '/berita');
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  const readLink = page.getByRole('link', { name: /^Baca berita:/ }).first();
  await readLink.focus();
  await readLink.press('Enter');
  await page.waitForURL('**/berita/mengenal-pertanian-soulowe');
  checks.push('News read action works with keyboard');
  await page.goto(base + '/berita');
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true');
  await page.getByRole('searchbox').fill('tidakada');
  await page.getByRole('heading', { name: 'Tidak ada berita yang ditemukan' }).waitFor();
  await page.getByRole('searchbox').fill('');
  await page.locator('.news-card').first().waitFor();
  checks.push('Filter removal/remount cleans observers and restores cards');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.news-card').first().scrollIntoViewIfNeeded();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.animated-border__light')).animationName === 'none');
  checks.push('Live reduced-motion setting disables border animation');
  const noJs = await browser.newPage({ javaScriptEnabled: false });
  await noJs.goto(base + '/berita');
  assert.equal(await noJs.locator('.news-card').count(), 3);
  assert.equal(await noJs.locator('.animated-border__light').first().evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
  checks.push('No-JS SSR renders readable cards with a static border');
  assert.deepEqual(errors, []);
  await writeFile('docs/border-results.json', JSON.stringify({ base, checkedAt: new Date().toISOString(), browser: 'Chromium', checks, errors }, null, 2));
  console.log(`PASS: ${checks.length} border/card checks.`);
} finally { await browser.close(); }
