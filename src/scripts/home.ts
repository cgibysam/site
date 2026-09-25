import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

const hero = document.querySelector<HTMLElement>('[data-hero]');
if (hero && finePointer && !reduceMotion) {
  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    hero.style.setProperty('--pointer-x', `${x}%`);
    hero.style.setProperty('--pointer-y', `${y}%`);
  }, { passive: true });
}

const layers = gsap.utils.toArray<HTMLElement>('[data-burger-layer]');
const labels = gsap.utils.toArray<HTMLElement>('[data-ingredient-label]');

if (!reduceMotion && layers.length) {
  gsap.set(labels, { opacity: 0, y: 14 });

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: '[data-story]',
      start: 'top top',
      end: '+=2600',
      scrub: 0.7,
      pin: '[data-story-stage]',
      anticipatePin: 1
    }
  });

  layers.forEach((layer, index) => {
    const shift = Number(layer.dataset.shift ?? 0);
    const rotate = Number(layer.dataset.rotate ?? 0);
    timeline.to(layer, {
      y: shift,
      rotation: rotate,
      scale: 1 + Math.abs(shift) / 2400,
      duration: 1,
      ease: 'power2.out'
    }, 0);
  });

  timeline.to('[data-burger-copy]', {
    opacity: 0.15,
    y: -28,
    duration: 0.4
  }, 0.15);

  timeline.to(labels, {
    opacity: 1,
    y: 0,
    stagger: 0.07,
    duration: 0.35
  }, 0.48);

  timeline.to('[data-story-glow]', {
    scale: 1.18,
    opacity: 0.85,
    duration: 0.5
  }, 0.3);
} else {
  labels.forEach((label) => {
    label.style.opacity = '1';
    label.style.transform = 'none';
  });
}

const revealItems = gsap.utils.toArray<HTMLElement>('[data-reveal]');
if (!reduceMotion) {
  revealItems.forEach((item) => {
    gsap.from(item, {
      y: 36,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: item,
        start: 'top 86%',
        once: true
      }
    });
  });
}

window.addEventListener('pagehide', () => {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
});
