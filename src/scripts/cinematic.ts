export {};
const root = document.querySelector<HTMLElement>('[data-cinema]');
const canvas = root?.querySelector<HTMLCanvasElement>('[data-cinema-canvas]');
const context = canvas?.getContext('2d');
const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
const preference = matchMedia('(prefers-reduced-motion: no-preference) and (min-height: 600px)');

// Static chapters are the default. Enhance only after the first real render loads.
if (root && canvas && context && root.dataset.ready === 'true' && 'createImageBitmap' in window && !connection?.saveData) {
  let stop: (() => void) | undefined;
  const start = () => {
    stop?.(); stop = undefined;
    if (!preference.matches) return;
    const stage = root.querySelector<HTMLElement>('[data-cinema-stage]')!;
    const controls = root.querySelector<HTMLElement>('[data-cinema-controls]')!;
    const progressBar = root.querySelector<HTMLElement>('[data-cinema-progress]')!;
    const instruction = root.querySelector<HTMLElement>('[data-cinema-instruction]')!;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-cinema-scene]'));
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-scene-link]'));
    const mobile = innerWidth <= 900;
    const size = mobile ? 500 : 800;
    canvas.width = canvas.height = size;
    const abort = new AbortController();
    const cache = new Map<number, ImageBitmap>();
    const pending = new Set<number>();
    const failed = new Set<number>();
    let queue: number[] = [];
    let target = 0, paintedPosition = -1, raf = 0;
    let displayed = 0, lastTime = 0;
    const blobs = new Map<number, Blob>();
    let active = false, disposed = false;
    let origin = 0, travel = 1;
    let currentChapter = -1;
    const url = (frame:number) => `/media/velorne/${mobile ? 'sequence-mobile' : 'sequence'}/${String(frame).padStart(3,'0')}.webp?v=${root.dataset.mediaVersion}`;
    const measure = () => { origin = root.getBoundingClientRect().top + scrollY; travel = Math.max(1,root.offsetHeight - stage.offsetHeight); };
    const chapter = (index:number) => {
      if (index === currentChapter) return;
      currentChapter = index;
      // Keep focus outside a panel before it becomes inert during scroll.
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && scenes.some((scene,i) => i !== index && scene.contains(focused))) {
        links.find(link => link.closest('[data-cinema-controls]') && Number(link.dataset.sceneLink) === index)?.focus({preventScroll:true});
      }
      root.dataset.chapter = String(index);
      scenes.forEach((scene,i) => {
        scene.toggleAttribute('data-active',i === index);
        scene.inert = i !== index;
        scene.setAttribute('aria-hidden',String(i !== index));
      });
      links.forEach(link => {
        if (link.closest('[data-cinema-controls]') && Number(link.dataset.sceneLink) === index) link.setAttribute('aria-current','step');
        else link.removeAttribute('aria-current');
      });
      instruction.textContent = ['Scroll to look within.','Continue to bring it together.','The complete form. Continue to explore.'][index]!;
    };
    const paint = () => {
      const frame = cache.get(target);
      const position=displayed*59;
      const lower=cache.get(Math.floor(position)), upper=cache.get(Math.ceil(position));
      const canBlend=Boolean(lower && upper);
      const paintPosition=canBlend ? position : target;
      if (!frame || paintPosition === paintedPosition || document.hidden) return;
      context.clearRect(0,0,size,size);
      if (lower && upper) {
        const fraction=position-Math.floor(position);
        // Interpolate adjacent renders in premultiplied alpha so slow scrolling
        // does not visibly tick through the source sequence's 60 poses.
        context.globalAlpha=1-fraction;
        context.drawImage(lower,0,0,size,size);
        context.globalCompositeOperation='lighter';
        context.globalAlpha=fraction;
        context.drawImage(upper,0,0,size,size);
        context.globalAlpha=1;
        context.globalCompositeOperation='source-over';
      } else context.drawImage(frame,0,0,size,size);
      canvas.dataset.frame = String(target);
      paintedPosition = paintPosition;
    };
    const trim = () => {
      const farthest = [...cache.keys()].sort((a,b) => Math.abs(b-target) - Math.abs(a-target));
      while (cache.size > 14) { const key=farthest.shift()!; cache.get(key)?.close(); cache.delete(key); }
    };
    const pump = () => {
      if (disposed || document.hidden) return;
      while (pending.size < 2 && queue.length) {
        const frame=queue.shift()!;
        if (cache.has(frame) || pending.has(frame) || failed.has(frame)) continue;
        pending.add(frame);
        (blobs.has(frame) ? Promise.resolve(blobs.get(frame)!) : fetch(url(frame),{signal:abort.signal,cache:'force-cache'})
          .then(response => { if (!response.ok) throw new Error('Frame unavailable'); return response.blob(); }))
          .then(blob => { blobs.set(frame,blob); return blob; })
          .then(blob => createImageBitmap(blob))
          .then(bitmap => {
            if (disposed) { bitmap.close(); return; }
            cache.set(frame,bitmap); trim();
            if (!active) {
              active=true; root.dataset.enhanced='true'; controls.hidden=false; canvas.hidden=false;
              measure(); requestUpdate(); warm();
            }
            paint();
          })
          .catch(() => {
            if (disposed) return;
            failed.add(frame);
            // Missing media restores all static chapters instead of a frozen film.
            stop?.();
          })
          .finally(() => { pending.delete(frame); pump(); });
      }
    };
    // Keep compressed frames warm, but cap decoded GPU/bitmap memory.
    const warm = async () => {
      for (let frame=1;frame<60 && !disposed;frame++) {
        if (blobs.has(frame) || pending.has(frame)) continue;
        try {
          const response=await fetch(url(frame),{signal:abort.signal,cache:'force-cache'});
          if (response.ok && !disposed) blobs.set(frame,await response.blob());
        } catch { return; }
      }
    };
    const smooth = (a:number,b:number,p:number) => { const t=Math.min(1,Math.max(0,(p-a)/(b-a))); return t*t*(3-2*t); };
    const mix = (a:number[],b:number[],t:number) => a.map((v,i)=>Math.round(v+(b[i]!-v)*t));
    const update = (time:number) => {
      raf=0;
      if (disposed || !active || document.hidden) return;
      const desired=Math.min(1,Math.max(0,(scrollY-origin)/travel));
      const dt=Math.min(64,lastTime ? time-lastTime : 16); lastTime=time;
      displayed+=(desired-displayed)*(1-Math.exp(-dt/95));
      if (Math.abs(desired-displayed)<.00015) displayed=desired;
      const progress=displayed;
      target=Math.round(progress*59);
      chapter(progress < .28 ? 0 : progress < .78 ? 1 : 2);
      const enter=smooth(.20,.36,progress), exit=smooth(.70,.86,progress);
      const background=mix(mix([241,242,239],[12,18,24],enter),[220,232,242],exit);
      stage.style.backgroundColor=`rgb(${background.join(',')})`;
      const fades=[1-smooth(.17,.27,progress),smooth(.29,.39,progress)*(1-smooth(.66,.77,progress)),smooth(.79,.89,progress)];
      scenes.forEach((scene,i)=>{
        const copy=scene.querySelector<HTMLElement>('.cinema-copy')!;
        copy.style.opacity=String(fades[i]);
        copy.style.translate=`0 ${(1-fades[i]!)*20}px`;
      });
      // A quiet camera drift continues between the rendered assembly frames.
      canvas.style.scale=String(1 + .065*Math.sin(progress*Math.PI));
      canvas.style.rotate=`${-2*Math.sin(progress*Math.PI*2)}deg`;
      progressBar.style.transform=`scaleX(${progress})`;
      const direction=desired>=displayed ? 1 : -1;
      queue=[target,...Array.from({length:8},(_,i)=>target+(i+1)*direction),target-direction]
        .filter(frame => frame>=0 && frame<60 && !cache.has(frame));
      paint();
      if (scrollY + innerHeight >= origin && scrollY <= origin+root.offsetHeight) pump();
      if (displayed!==desired) requestUpdate();
    };
    const requestUpdate = () => { if (!raf) raf=requestAnimationFrame(update); };
    const resize = () => { if (active) { measure(); requestUpdate(); } };
    const jump = (event:MouseEvent) => {
      if (!active || !(event.currentTarget instanceof HTMLAnchorElement)) return;
      event.preventDefault();
      const index=Number(event.currentTarget.dataset.sceneLink);
      const position=[0,.52,1][index]!;
      // Move focus to the always-visible chapter control before changing panels.
      links.find(link => link.closest('[data-cinema-controls]') && Number(link.dataset.sceneLink)===index)?.focus({preventScroll:true});
      window.scrollTo({top:origin+travel*position,behavior:'smooth'});
    };
    links.forEach(link => link.addEventListener('click',jump));
    window.addEventListener('scroll',requestUpdate,{passive:true});
    window.addEventListener('resize',resize);
    document.addEventListener('visibilitychange',requestUpdate);
    stop = () => {
      disposed=true; abort.abort(); cancelAnimationFrame(raf);
      window.removeEventListener('scroll',requestUpdate);
      window.removeEventListener('resize',resize);
      document.removeEventListener('visibilitychange',requestUpdate);
      links.forEach(link => link.removeEventListener('click',jump));
      cache.forEach(bitmap=>bitmap.close()); cache.clear(); blobs.clear();
      stage.style.removeProperty("background-color"); canvas.style.removeProperty("scale"); canvas.style.removeProperty("rotate");
      scenes.forEach(scene => scene.querySelector(".cinema-copy")?.removeAttribute("style"));
      scenes.forEach(scene => { scene.inert=false; scene.removeAttribute('aria-hidden'); scene.removeAttribute('data-active'); });
      delete root.dataset.enhanced; delete root.dataset.chapter;
      canvas.hidden=true; controls.hidden=true;
    };
    queue=[0]; pump();
  };
  preference.addEventListener('change',start);
  window.addEventListener('pagehide',event => { if (!event.persisted) stop?.(); });
  start();
}
