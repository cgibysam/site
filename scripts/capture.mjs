import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';

await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {});
const errors = [];
const results = [];
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4321';
try {
  for (const width of [390, 768, 1440]) {
    for (const reducedMotion of ['reduce', 'no-preference']) {
      const label = `${width}-${reducedMotion}`;
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion });
      const page = await context.newPage();
      page.on('pageerror', (error) => errors.push({ label, message: error.message }));
      page.on('console', (message) => { if (message.type() === 'error') errors.push({ label, message: message.text() }); });
      page.on('response', (response) => { if (response.status() >= 400) errors.push({ label, message: `${response.status()} ${response.url()}` }); });
      await page.goto(baseURL, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('main').count(), 1);
      assert.match(await page.title(), /VELORNE/);
      assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/);
      const brokenAnchors = await page.locator('a[href^="#"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')).filter((href) => !document.getElementById(href.slice(1))));
      assert.deepEqual(brokenAnchors, []);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('.skip-link').evaluate((el) => el === document.activeElement), true);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('.site-header .wordmark').evaluate((el) => el === document.activeElement), true);
      await page.screenshot({ path: `artifacts/${label}-hero.png` });
      if (width === 390) {
        await page.locator('.mobile-nav summary').click();
        assert.equal(await page.locator('.mobile-nav__panel').isVisible(), true);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.mobile-nav').getAttribute('open'), null);
      }
      await page.locator('[data-view-button="rear"]').click();
      assert.equal(await page.locator('[data-view="rear"]').isVisible(), true);
      assert.equal(await page.locator('[data-view-button="rear"]').getAttribute('aria-pressed'), 'true');
      if (await page.locator('[data-zoom]').isVisible()) {
        await page.locator('[data-zoom]').click();
        assert.equal(await page.locator('[data-lightbox]').isVisible(), true);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('[data-lightbox]').isVisible(), false);
        assert.equal(await page.locator('[data-zoom]').evaluate((el) => el === document.activeElement), true);
      }
      await page.screenshot({ path: `artifacts/${label}-product.png` });
      await page.locator('.component-notes summary').click();
      assert.equal(await page.locator('.component-notes dt').count(), 9);
      assert.equal(await page.locator('.component-notes dl').isVisible(), true);
      await page.locator('.component-notes summary').click();
      const ready = await page.locator('[data-anatomy]').getAttribute('data-ready');
      if (ready === 'true') {
        const top = await page.locator('#anatomy').evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
        for (const offset of [0, 800, 1600]) {
          await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top + offset);
          await page.waitForTimeout(600);
          await page.screenshot({ path: `artifacts/${label}-anatomy-${offset}.png` });
        }
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      assert.equal(overflow, false, `${label}: horizontal overflow`);
      if (reducedMotion === 'reduce') {
        assert.equal(await page.locator('.pin-spacer').count(), 0);
        const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        await writeFile(`artifacts/${label}-accessibility.json`, JSON.stringify(accessibility, null, 2));
        assert.deepEqual(accessibility.violations.map(({ id, nodes }) => ({ id, count: nodes.length })), [], `${label}: accessibility violations`);
        await page.screenshot({ path: `artifacts/${label}-full.png`, fullPage: true });
      }
      results.push({ label, anatomyAssetsPresent: ready === 'true' });
      await context.close();
    }
  }
  const noJsContext = await browser.newContext({ javaScriptEnabled: false });
  const page = await noJsContext.newPage();
  await page.goto(baseURL);
  assert.equal(await page.locator('h1').isVisible(), true);
  await page.locator('.component-notes summary').click();
  assert.equal(await page.locator('.component-notes dl').isVisible(), true);
  assert.equal(await page.locator('[data-gallery-controls]').isVisible(), false);
  await noJsContext.close();
} finally {
  await writeFile('artifacts/runtime-errors.json', JSON.stringify(errors, null, 2));
  await writeFile('artifacts/verification.json', JSON.stringify(results, null, 2));
  await browser.close();
}
assert.deepEqual(errors, [], 'Browser errors detected');
