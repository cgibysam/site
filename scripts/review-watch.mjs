import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome' });
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4322';
const results = [];
await mkdir('artifacts', { recursive: true });
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const requests = [], errors = [];
    page.on('request', request => requests.push(request.url()));
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    assert.equal(requests.some(url => url.endsWith('.mp4')), false, 'Film must not preload');
    await page.screenshot({ path: `artifacts/apple-${width}-hero.png` });
    await page.locator('[data-play-film]').click();
    await page.waitForFunction(() => {
      const video = document.querySelector('[data-film]');
      return video.currentTime > .15 && !video.paused;
    });
    assert.equal(await page.locator('[data-film]').evaluate(video => video.duration), 8);
    await page.locator('[data-film]').evaluate(video => { if (video instanceof HTMLVideoElement) { video.pause(); video.currentTime = 4; } });
    await page.waitForFunction(() => !document.querySelector('[data-film]').seeking);
    await page.screenshot({ path: `artifacts/apple-${width}-film.png` });
    const filmAudit = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    assert.deepEqual(filmAudit.violations.map(v => ({ id:v.id, nodes:v.nodes.map(n => n.target) })), []);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-film]').evaluate(video => video.paused), true);
    assert.equal(await page.locator('[data-play-film]').evaluate(el => el === document.activeElement), true);
    await page.locator('[data-slide="1"]').click();
    await page.waitForFunction(() => document.querySelector('[data-highlights]').scrollLeft > 20);
    await page.locator('.highlight-detail summary').nth(2).click();
    await page.screenshot({ path: `artifacts/apple-${width}-highlight-detail.png` });
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    await writeFile(`artifacts/apple-${width}-open-highlight-axe.json`, JSON.stringify(accessibility.violations, null, 2));
    assert.deepEqual(accessibility.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })), []);
    await page.locator('.highlight-detail summary').nth(2).click();
    await page.locator('#anatomy').scrollIntoViewIfNeeded();
    await page.waitForSelector('[data-anatomy][data-animated="true"]');
    const sequence = page.locator('[data-sequence-canvas]');
    await page.waitForFunction(() => document.querySelector('[data-sequence-canvas]').hasAttribute('data-frame'));
    const top = await page.locator('#anatomy').evaluate(el => el.getBoundingClientRect().top + window.scrollY);
    const frames = [];
    for (const fraction of [.1, .5, .9]) {
      const y = width > 900 ? top - 65 + fraction * 1800 : await page.locator('.anatomy__visual').evaluate((el, fraction) => el.getBoundingClientRect().top + window.scrollY - innerHeight * .2 + (el.clientHeight - innerHeight * .6) * fraction, fraction);
      await page.evaluate(y => scrollTo({ top:y, behavior:'instant' }), y);
      await page.waitForTimeout(1000);
      frames.push(Number(await sequence.getAttribute('data-frame')));
      await page.screenshot({ path: `artifacts/apple-${width}-sequence-${fraction}.png` });
    }
    assert.equal(new Set(frames).size, 3, 'Scroll must visibly advance the assembly');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    assert.deepEqual(errors, []);
    results.push({ width, film: '8 seconds; lazy-loaded; plays; Escape pauses and restores focus', sequenceFrames: frames, openHighlightAxeViolations: 0, errors });
    await context.close();
  }
  const saving = await browser.newPage();
  await saving.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData:true }, configurable:true }));
  await saving.goto(baseURL, { waitUntil: 'networkidle' });
  await saving.locator('#anatomy').scrollIntoViewIfNeeded();
  assert.equal(await saving.locator('[data-anatomy]').getAttribute('data-animated'), null);
  assert.equal(await saving.locator('[data-sequence-canvas]').isVisible(), false);
  results.push({ saveData: 'Static assembly; no scroll animation' });
  await saving.close();
} finally {
  await writeFile('artifacts/apple-interaction-review.json', JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
