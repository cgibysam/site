import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1
});

await page.goto('http://127.0.0.1:4321', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'artifacts/desktop-home.png', fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://127.0.0.1:4321', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'artifacts/mobile-home.png', fullPage: true });

await page.emulateMedia({ reducedMotion: 'reduce' });
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto('http://127.0.0.1:4321', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'artifacts/reduced-motion-home.png', fullPage: true });

await browser.close();
