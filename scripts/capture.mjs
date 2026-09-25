import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('artifacts', { recursive: true });

const browser = await chromium.launch();
const runtimeErrors = [];

async function attachDiagnostics(page, label) {
  page.on('pageerror', (error) => runtimeErrors.push({ label, type: 'pageerror', message: error.message }));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      runtimeErrors.push({ label, type: 'console', message: message.text() });
    }
  });
}

async function openPage({ width, height, reducedMotion = false, label }) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1
  });
  await attachDiagnostics(page, label);
  if (reducedMotion) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  }
  await page.goto('http://127.0.0.1:4321', { waitUntil: 'networkidle' });
  return page;
}

// Static/full-page captures are taken with reduced motion so pinned/reveal
// animations do not create misleading blank regions in a fullPage screenshot.
{
  const page = await openPage({ width: 1440, height: 1000, reducedMotion: true, label: 'desktop-static' });
  await page.screenshot({ path: 'artifacts/desktop-static.png', fullPage: true });
  await page.close();
}

{
  const page = await openPage({ width: 390, height: 844, reducedMotion: true, label: 'mobile-static' });
  await page.screenshot({ path: 'artifacts/mobile-static.png', fullPage: true });

  const menu = page.locator('.mobile-nav');
  if (!(await menu.isVisible())) {
    throw new Error('Mobile navigation control is not visible at 390px.');
  }
  await page.locator('.mobile-nav summary').click();
  if (!(await page.locator('.mobile-nav__panel').isVisible())) {
    throw new Error('Mobile navigation panel did not open.');
  }
  await page.screenshot({ path: 'artifacts/mobile-menu-open.png', fullPage: false });

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  if (overflow.scrollWidth > overflow.clientWidth + 1) {
    throw new Error(`Unexpected mobile horizontal overflow: ${overflow.scrollWidth}px > ${overflow.clientWidth}px`);
  }

  await page.close();
}

// Default-motion captures test important animation states as viewport shots.
{
  const page = await openPage({ width: 1440, height: 1000, label: 'desktop-motion' });
  await page.screenshot({ path: 'artifacts/desktop-hero-motion.png', fullPage: false });

  const structure = await page.evaluate(() => ({
    h1Count: document.querySelectorAll('h1').length,
    mainCount: document.querySelectorAll('main').length,
    navCount: document.querySelectorAll('nav').length,
    title: document.title,
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? ''
  }));
  if (structure.h1Count !== 1) throw new Error(`Expected exactly one h1, found ${structure.h1Count}`);
  if (structure.mainCount !== 1) throw new Error(`Expected exactly one main landmark, found ${structure.mainCount}`);
  if (!structure.title) throw new Error('Document title is empty.');
  if (!structure.robots.includes('noindex')) throw new Error('Demo noindex protection is missing.');

  const storyTop = await page.locator('#story').evaluate((element) => element.offsetTop);
  await page.evaluate((y) => window.scrollTo({ top: y + 1100, behavior: 'instant' }), storyTop);
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'artifacts/desktop-story-mid.png', fullPage: false });

  await page.evaluate((y) => window.scrollTo({ top: y + 2200, behavior: 'instant' }), storyTop);
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'artifacts/desktop-story-late.png', fullPage: false });
  await page.close();
}

await writeFile('artifacts/runtime-errors.json', JSON.stringify(runtimeErrors, null, 2));

await browser.close();

if (runtimeErrors.length) {
  console.error('Browser runtime errors detected:', runtimeErrors);
  process.exit(1);
}
