import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Bounded decoded-frame cache: <= 10 bitmaps; only two requests in flight.
 * The actual 3D occlusion/reflections are rendered in Blender, never simulated
 * by separating flat product cutouts in the browser.
 */
export async function initSequence(story: HTMLElement) {
  const canvas = story.querySelector<HTMLCanvasElement>('[data-sequence-canvas]');
  const context = canvas?.getContext('2d', { alpha: true });
  if (!canvas || !context || !('createImageBitmap' in window)) return;
  const instruction = story.querySelector('[data-instruction]');
  const chapter = story.querySelector('[data-chapter]');
  const progress = story.querySelector<HTMLElement>('[data-sequence-progress]');
  const poster = story.querySelector<HTMLElement>('.sequence .product-image');
  const media = gsap.matchMedia();
  media.add({ all: '(min-width: 0px)', desktop: '(min-width: 901px)', reduce: '(prefers-reduced-motion: reduce)' }, (match) => {
    const { desktop, reduce } = match.conditions!;
    if (reduce) {
      canvas.hidden = true;
      if (poster) poster.style.visibility = '';
      if (instruction) instruction.textContent = 'A still view of the assembly. Explore each component below.';
      if (chapter) chapter.textContent = '02 / The layers revealed';
      return;
    }
    const mobile = !desktop && story.dataset.mobileReady === 'true';
    const size = mobile ? 500 : 800;
    canvas.width = canvas.height = size;
    const cache = new Map<number, ImageBitmap>();
    const loading = new Set<number>();
    const failed = new Set<number>();
    const abort = new AbortController();
    let queue: number[] = [];
    let target = 0;
    let lastDrawn = -1;
    let disposed = false;
    let near = true;
    let raf = 0;
    const state = { frame: 0 };

    const paint = () => {
      raf = 0;
      if (disposed || !near || document.hidden) return;
      const bitmap = cache.get(target);
      if (!bitmap || lastDrawn === target) return;
      context.clearRect(0, 0, size, size);
      context.drawImage(bitmap, 0, 0, size, size);
      lastDrawn = target;
      canvas.hidden = false;
      canvas.dataset.frame = String(target);
      if (poster) poster.style.visibility = 'hidden';
    };
    const draw = () => { if (!raf) raf = requestAnimationFrame(paint); };
    const trim = () => {
      const farthest = [...cache.keys()].sort((a, b) => Math.abs(b - target) - Math.abs(a - target));
      while (cache.size > 10) {
        const key = farthest.shift()!;
        cache.get(key)?.close(); cache.delete(key);
      }
    };
    const pump = () => {
      if (disposed || !near || document.hidden) return;
      while (loading.size < 2 && queue.length) {
        const frame = queue.shift()!;
        if (cache.has(frame) || loading.has(frame) || failed.has(frame)) continue;
        loading.add(frame);
        const url = `/media/velorne/${mobile ? 'sequence-mobile' : 'sequence'}/${String(frame).padStart(3, '0')}.webp?v=${story.dataset.mediaVersion}`;
        fetch(url, { signal: abort.signal, cache: 'force-cache' })
          .then((response) => { if (!response.ok) throw new Error('Frame unavailable'); return response.blob(); })
          .then((blob) => createImageBitmap(blob))
          .then((bitmap) => {
            if (disposed) { bitmap.close(); return; }
            cache.set(frame, bitmap); trim(); draw();
          })
          .catch(() => {
            if (disposed) return;
            failed.add(frame);
            if (frame === target) {
              canvas.hidden = true;
              if (poster) poster.style.visibility = '';
              if (instruction) instruction.textContent = 'Explore the still assembly and component notes below.';
            }
          })
          .finally(() => { loading.delete(frame); pump(); });
      }
    };
    const update = () => {
      target = Math.max(0, Math.min(59, Math.round(state.frame)));
      queue = [target, target + 1, target - 1, target + 2, target - 2, target + 3, target - 3]
        .filter((frame) => frame >= 0 && frame < 60 && !cache.has(frame));
      if (chapter) chapter.textContent = target < 9 ? '01 / The complete form'
        : target < 19 ? '02 / Crystal, lifted into light'
        : target < 30 ? '03 / Hands, indices, dial'
        : target < 45 ? '04 / The architecture within'
        : '05 / A return to form';
      if (progress) progress.style.transform = `scaleX(${target / 59})`;
      draw(); pump();
    };
    story.dataset.animated = 'true';
    if (instruction) instruction.textContent = 'Scroll to separate. Continue to reassemble.';
    gsap.to(state, { frame: 59, ease: 'none', onUpdate: update, scrollTrigger: {
      trigger: desktop ? story : story.querySelector<HTMLElement>('.anatomy__visual'),
      start: desktop ? 'top 65px' : 'top 20%',
      end: desktop ? () => `+=${Math.max(1800, window.innerHeight * 2)}` : 'bottom 80%',
      pin: desktop ? '[data-stage]' : false,
      scrub: .3, invalidateOnRefresh: true,
    } });
    const observer = new IntersectionObserver((entries) => {
      near = entries.some((entry) => entry.isIntersecting);
      if (near) update();
    }, { rootMargin: '300px' });
    observer.observe(story);
    const visibility = () => { if (!document.hidden) update(); };
    document.addEventListener('visibilitychange', visibility);
    update();
    return () => {
      disposed = true; abort.abort(); observer.disconnect();
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', visibility);
      cache.forEach((bitmap) => bitmap.close()); cache.clear();
      canvas.hidden = true;
      if (poster) poster.style.visibility = '';
      if (progress) progress.style.transform = '';
      delete story.dataset.animated;
    };
  });
  // pagehide may precede a back-forward-cache restore, so only dispose for
  // permanent navigation; browser timers are already paused in a cached page.
  window.addEventListener('pagehide', (event) => { if (!event.persisted) media.revert(); }, { once: true });
}
