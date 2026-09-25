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
  await page.close();
}

// Default-motion captures test important animation states as viewport shots.
{
  const page = await openPage({ width: 1440, height: 1000, label: 'desktop-motion' });
  await page.screenshot({ path: 'artifacts/desktop-hero-motion.png', fullPage: false });

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
