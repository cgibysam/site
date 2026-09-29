import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.BASE_URL || 'http://127.0.0.1:4322';
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome' });
const results = [];
await mkdir('public/media/templates', { recursive:true });
await mkdir('artifacts', { recursive:true });
try {
  for (const design of [{ name:'studio', route:'/' }, { name:'atelier', route:'/atelier/' }, { name:'nocturne', route:'/nocturne/' }]) {
    for (const width of [390, 768, 1440]) {
      const context = await browser.newContext({ viewport:{ width,height:900 }, reducedMotion:'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if(response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      await page.goto(base + design.route, { waitUntil:'networkidle' });
      assert.equal(await page.locator('h1').count(),1);
      assert.equal(await page.locator('main').count(),1);
      assert.match(await page.locator('meta[name="robots"]').getAttribute('content'),/noindex/);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),true,`${design.name} ${width}: overflow`);
      const broken = await page.locator('a[href^="#"]').evaluateAll(links => links.map(el => el.getAttribute('href')).filter(href => !document.getElementById(href.slice(1))));
      assert.deepEqual(broken,[]);
      const scan = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
      const violations = scan.violations.map(item => ({ id:item.id, nodes:item.nodes.map(node => ({ target:node.target, summary:node.failureSummary })) }));
      await writeFile(`artifacts/templates-${design.name}-${width}-axe.json`,JSON.stringify(violations,null,2));
      await page.screenshot({ path:`artifacts/templates-${design.name}-${width}.png` });
      if(width === 1440) {
        await page.addStyleTag({ content:'.design-picker { display:none!important; }' });
        await page.setViewportSize({ width:1200,height:900 });
        await page.screenshot({ path:`public/media/templates/${design.name}.jpg`,type:'jpeg',quality:84 });
        await page.setViewportSize({ width,height:900 });
        await page.screenshot({ path:`artifacts/templates-${design.name}-full.png`,fullPage:true });
      }
      assert.deepEqual(errors,[]);
      results.push({ design:design.name,width,violations });
      await context.close();
    }
  }
} finally {
  await writeFile('artifacts/templates-review.json',JSON.stringify(results,null,2));
  await browser.close();
}
console.log(JSON.stringify(results,null,2));
assert.equal(results.some(result => result.violations.length),false,'Accessibility findings require review');
