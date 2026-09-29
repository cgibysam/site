import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';

// Reproducible local lab diagnostic, not field Core Web Vitals certification.
const browser = await chromium.launch(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const session = await page.context().newCDPSession(page);
await session.send('Network.enable');
await session.send('Network.setCacheDisabled', { cacheDisabled: true });
await session.send('Network.emulateNetworkConditions', {
  offline: false, latency: 150, downloadThroughput: 1600000 / 8, uploadThroughput: 750000 / 8,
});
await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.addInitScript(() => {
  window.__lab = { lcp: 0, cls: 0, interactions: [] };
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) window.__lab.lcp = entry.startTime;
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__lab.cls += entry.value;
  }).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) if (entry.interactionId) window.__lab.interactions.push(entry.duration);
  }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
});
try {
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4321', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const initial = await page.evaluate(() => ({
    ...window.__lab,
    resources: performance.getEntriesByType('resource').map(({ name, transferSize, duration }) => ({ name, transferSize, duration })),
  }));
  if (await page.locator('[data-cinema]').count()) {
    await page.locator('.cinema-header a[href="#details"]').click();
  } else {
    await page.locator('.mobile-nav summary').click();
    await page.locator('.mobile-nav__panel a[href="#details"]').click();
  }
  await page.locator('[data-view-button="rear"]').click();
  await page.locator('.product__accordions summary').first().click();
  await page.waitForTimeout(500);
  const interaction = await page.evaluate(() => window.__lab);
  await mkdir('artifacts', { recursive: true });
  const result = {
    conditions: 'Local Chrome, 390x844, DPR 2, CPU 4x slowdown, 1.6 Mbps down, 150 ms latency, cold cache',
    initial,
    interaction,
    note: 'CLS is a sum of observed shifts, not field session-window aggregation. Interaction samples are lab observations, not field INP.',
  };
  await writeFile(`artifacts/${process.env.REPORT_NAME || 'performance'}.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ lcpMs: initial.lcp, cls: initial.cls, initialBytes: initial.resources.reduce((s, r) => s + r.transferSize, 0), interactionSamples: interaction.interactions }, null, 2));
} finally { await browser.close(); }
