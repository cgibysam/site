import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const base = process.env.BASE_URL || 'http://127.0.0.1:4322';
const browser = await chromium.launch({ channel:process.env.BROWSER_CHANNEL || 'chrome' });
const results = [];
try {
  for (const width of [390,1440]) {
    const context = await browser.newContext({ viewport:{width,height:900}, reducedMotion:'reduce' });
    const page = await context.newPage();
    await page.goto(base + '/templates/',{waitUntil:'networkidle'});
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('.design-card').count(),4);
    assert.equal(await page.locator('.design-card img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)),true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),true);
    const scan = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    assert.deepEqual(scan.violations.map(v => ({id:v.id,nodes:v.nodes.map(n => n.target)})),[]);
    await page.screenshot({path:`artifacts/templates-board-${width}.png`,fullPage:true});
    await page.locator('a.design-card__open[href="/atelier/"]').click();
    await page.locator('.design-picker summary').click();
    assert.equal(await page.locator('.design-picker a[aria-current="page"]').textContent(),'02 — AtelierWarm. Expressive.');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.design-picker').getAttribute('open'),null);
    await page.locator('.design-picker summary').click();
    await page.locator('.design-picker a[href="/nocturne/"]').click();
    assert.match(page.url(),/nocturne/);
    assert.equal(await page.locator('.design-picker a[aria-current="page"]').count(),1);
    results.push({width,comparison:'4 previews; all load; links work; no overflow',picker:'switching and Escape pass',axeViolations:0});
    await context.close();
  }
  for (const config of [{width:1440,reducedMotion:'no-preference',auto:true},{width:1440,reducedMotion:'reduce',auto:false},{width:390,reducedMotion:'no-preference',auto:false}]) {
    const context = await browser.newContext({viewport:{width:config.width,height:900},reducedMotion:config.reducedMotion});
    const page = await context.newPage();
    const errors = [], videos = [];
    page.on('pageerror',error => errors.push(error.message));
    page.on('request',request => {if(request.url().endsWith('.mp4')) videos.push(request.url());});
    await page.goto(base + '/nocturne/',{waitUntil:'networkidle'});
    const film = page.locator('[data-ambient]');
    if(!config.auto) {
      assert.equal(videos.length,0,'No background film load for mobile/reduced motion');
      await page.locator('[data-ambient-toggle]').click();
    }
    await page.waitForFunction(() => {const video=document.querySelector('[data-ambient]'); return !video.paused && video.currentTime > .1;});
    await page.locator('[data-ambient-toggle]').click();
    assert.equal(await film.evaluate(video => video.paused),true);
    await page.locator('[data-ambient-toggle]').click();
    await page.waitForFunction(() => !document.querySelector('[data-ambient]').paused);
    await page.locator('#details').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('[data-ambient]').paused);
    assert.deepEqual(errors,[]);
    results.push({...config,film:'plays, pauses, resumes, pauses offscreen',errors});
    await context.close();
  }
} finally {
  await writeFile('artifacts/template-controls-review.json',JSON.stringify(results,null,2));
  await browser.close();
}
console.log(JSON.stringify(results,null,2));
