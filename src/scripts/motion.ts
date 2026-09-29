import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initMotion() {
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    const hero = document.querySelector<HTMLElement>('.hero');
    const visual = document.querySelector<HTMLElement>('[data-hero-visual]');
    const tilt = document.querySelector<HTMLElement>('.hero__tilt');
    if (!hero || !visual || !tilt) return;
    gsap.to(visual, { y: -65, rotation: 7, scale: 1.06, ease: 'none', scrollTrigger: {
      trigger: hero, start: 'top top', end: 'bottom top', scrub: .65,
    } });
    gsap.utils.toArray<HTMLElement>('.intro h2, .intro .body-copy, .section-heading h2, .closing h2').forEach((element) => {
      gsap.from(element, { y: 32, duration: .9, ease: 'power2.out', scrollTrigger: {
        trigger: element, start: 'top 92%', once: true,
      } });
    });
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const turn = gsap.quickTo(tilt, 'rotation', { duration: .8, ease: 'power2.out' });
    const slide = gsap.quickTo(tilt, 'x', { duration: .8, ease: 'power2.out' });
    const move = (event: PointerEvent) => {
      if (!finePointer.matches) return;
      const bounds = hero.getBoundingClientRect();
      const ratio = (event.clientX - bounds.left) / bounds.width - .5;
      turn(ratio * 5); slide(ratio * 15);
    };
    const reset = () => { turn(0); slide(0); };
    hero.addEventListener('pointermove', move);
    hero.addEventListener('pointerleave', reset);
    return () => {
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerleave', reset);
    };
  });
  window.addEventListener('pagehide', (event) => { if (!event.persisted) media.revert(); }, { once: true });
}
