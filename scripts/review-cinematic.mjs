import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.BASE_URL || 'http://127.0.0.1:4322';
const browser = await chromium.launch({ channel:'chrome' });
const results = [];
await mkdir('artifacts', { recursive:true });
try {
  for (const width of [375, 390, 768, 1440]) {
    const height=width===375 ? 667 : 900;
    const context = await browser.newContext({ viewport:{ width,height } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/cinematic/`, { waitUntil:'networkidle' });
    await page.waitForSelector('[data-enhanced]');
    for (const [chapter, progress, frame] of [[0,0,0],[1,.52,31],[2,1,59]]) {
      await page.evaluate(p => {
        const root=document.querySelector('[data-cinema]');
        const stage=document.querySelector('[data-cinema-stage]');
        window.scrollTo({ top:root.offsetTop+(root.offsetHeight-stage.offsetHeight)*p,behavior:'instant' });
      },progress);
      await page.waitForFunction(f=>document.querySelector('[data-cinema-canvas]').dataset.frame===String(f),frame);
      await page.waitForTimeout(450);
      assert.equal(await page.locator('[data-cinema]').getAttribute('data-chapter'),String(chapter));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
      if(width===375){
        const overlap=await page.evaluate(()=>{
          const canvas=document.querySelector('canvas'), bounds=canvas.getBoundingClientRect();
          const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
          let firstRow=canvas.height;
          for(let i=3;i<pixels.length;i+=4)if(pixels[i]>32){firstRow=Math.floor((i/4)/canvas.width);break;}
          // The render has transparent margins; compare visible product pixels.
          return document.querySelector('[data-active] .cinema-description').getBoundingClientRect().bottom>bounds.top+firstRow/canvas.height*bounds.height;
        });
        assert.equal(overlap,false,'Small-phone copy overlaps the moving watch');
      }
      const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      results.push({width,height,chapter,frame,violations:audit.violations});
      await page.screenshot({path:`artifacts/cinematic-${width}-${chapter}.png`});
    }
    // Exercise continuous input and capture frame cadence, not just chapter endpoints.
    const cadence=await page.evaluate(async()=>{
      const root=document.querySelector('[data-cinema]');
      const stage=document.querySelector('[data-cinema-stage]');
      const canvas=document.querySelector('[data-cinema-canvas]');
      const frames=new Set(), intervals=[];
      let last=performance.now(), start=last;
      await new Promise(resolve=>{
        function tick(now){
          intervals.push(now-last);last=now;
          const p=Math.min(1,(now-start)/2500);
          window.scrollTo({top:root.offsetTop+(root.offsetHeight-stage.offsetHeight)*(1-p),behavior:'instant'});
          frames.add(canvas.dataset.frame);
          if(p<1) requestAnimationFrame(tick);else resolve();
        }
        requestAnimationFrame(tick);
      });
      intervals.sort((a,b)=>a-b);
      return {distinctFrames:frames.size,p95FrameInterval:intervals[Math.floor(intervals.length*.95)]};
    });
    assert.ok(cadence.distinctFrames>35,`Too few sequence frames: ${JSON.stringify(cadence)}`);
    results.push({width,cadence,errors});
    assert.deepEqual(errors,[]);
    if(width===1440){
      await page.waitForTimeout(700);
      await page.setViewportSize({width:1200,height:900});
      await page.addStyleTag({content:'.design-picker{display:none!important}'});
      await page.screenshot({path:'public/media/templates/cinematic.jpg',type:'jpeg',quality:84});
    }
    await page.locator('[data-cinema-controls] a[data-scene-link="1"]').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.querySelector('[data-cinema-canvas]').dataset.frame==='31');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForSelector('[data-enhanced]',{state:'detached'});
    assert.equal(await page.locator('[data-enhanced]').count(),0);
    assert.equal(await page.locator('[data-cinema-scene]:visible').count(),3);
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.waitForSelector('[data-enhanced]');
    results.push({width,keyboardChapterNavigation:'pass',runtimeMotionPreference:'pass'});
    await context.close();
  }
  for (const mode of ['reduced','save-data','missing-frame','no-js','short']) {
    const context=await browser.newContext({viewport:{width:390,height:mode==='short'?500:844},reducedMotion:mode==='reduced'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-js'});
    const page=await context.newPage();
    let frameRequests=0;
    page.on('request',r=>{if(r.resourceType()==='fetch' && /sequence(?:-mobile)?\//.test(r.url()))frameRequests++;});
    if(mode==='save-data')await page.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true}}));
    if(mode==='missing-frame')await page.route('**/sequence-mobile/000.webp*',route=>route.fulfill({status:404,body:''}));
    await page.goto(`${base}/cinematic/`,{waitUntil:'networkidle'});
    assert.equal(await page.locator('[data-enhanced]').count(),0);
    assert.equal(await page.locator('[data-cinema-scene]:visible').count(),3);
    if(['reduced','save-data','no-js','short'].includes(mode))assert.equal(frameRequests,0);
    if(mode!=='no-js'){
      const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      results.push({mode,violations:scan.violations});
    }
    await context.close();
  }
} finally {
  await writeFile('artifacts/cinematic-review.json',JSON.stringify(results,null,2));
  await browser.close();
}
console.log(JSON.stringify(results.map(r=>({...r,violations:r.violations?.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))})),null,2));
assert.equal(results.some(r=>r.violations?.length),false,'Review accessibility findings');
