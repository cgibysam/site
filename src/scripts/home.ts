import { afterLoad } from './frames';

// Native controls are available before any animation library loads.
const menu = document.querySelector<HTMLDetailsElement>('.mobile-nav');
menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => { menu.open = false; }));
menu?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    menu.open = false;
    menu.querySelector('summary')?.focus();
  }
});
document.addEventListener('click', (event) => {
  if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
});
const gallery = document.querySelector<HTMLElement>('[data-gallery]');
if (gallery) {
  const controls = gallery.querySelector<HTMLElement>('[data-gallery-controls]');
  if (controls) controls.hidden = false;
  const buttons = Array.from(gallery.querySelectorAll<HTMLButtonElement>('[data-view-button]'));
  buttons.forEach((button, index) => button.addEventListener('click', () => {
    gallery.querySelectorAll<HTMLElement>('[data-view]').forEach((view) => { view.hidden = view.dataset.view !== button.dataset.viewButton; });
    buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    const caption = gallery.querySelector('[data-gallery-caption]');
    if (caption) caption.textContent = `0${index + 1} / ${button.textContent} view`;
  }));
}
const zoom = document.querySelector<HTMLButtonElement>('[data-zoom]');
const lightbox = document.querySelector<HTMLDialogElement>('[data-lightbox]');
if (zoom && lightbox && gallery?.querySelector('img')) {
  zoom.hidden = false;
  zoom.addEventListener('click', () => {
    const source = gallery.querySelector<HTMLImageElement>('[data-view]:not([hidden]) img');
    const container = lightbox.querySelector('[data-lightbox-image]');
    if (!source || !container) return;
    const image = new Image(1400, 1400);
    image.src = source.src;
    image.alt = source.alt;
    image.addEventListener('error', () => { container.textContent = 'This product image is currently unavailable.'; }, { once: true });
    container.replaceChildren(image);
    lightbox.showModal();
  });
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) lightbox.close(); });
}
// A failed image leaves an explicit readable fallback, not a broken-image icon.
document.querySelectorAll<HTMLImageElement>('.product-image img').forEach((img) => {
  const fail = () => {
    const parent = img.parentElement;
    if (!parent) return;
    const message = document.createElement('p');
    message.className = 'image-fallback';
    message.textContent = 'Study 01 — product image unavailable';
    parent.replaceChildren(message);
  };
  img.addEventListener('error', fail, { once: true });
  if (img.complete && !img.naturalWidth) fail();
});
const story = document.querySelector<HTMLElement>('[data-anatomy]');
// Load the film only near its section. Static media serves reduced motion,
// data-saving connections, unsupported canvas, and JavaScript-free browsing.
if (story?.dataset.ready === 'true') {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (!connection?.saveData && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(async (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      try {
        const { initSequence } = await import('./sequence');
        await initSequence(story);
      } catch {
        const instruction = story.querySelector('[data-instruction]');
        if (instruction) instruction.textContent = 'Explore the still assembly and component notes below.';
      }
    }, { rootMargin: '200px' });
    // Even when the page opens at #anatomy, frames wait for window load.
    void afterLoad().then(() => observer.observe(story));
  }
}

// Native video controls provide pause, seeking, volume and keyboard support.
// No video bytes are requested until the visitor chooses to watch the film.
const filmDialog = document.querySelector<HTMLDialogElement>('[data-film-dialog]');
const film = filmDialog?.querySelector<HTMLVideoElement>('[data-film]');
const filmButton = document.querySelector<HTMLButtonElement>('[data-play-film]');
if (filmDialog && film && filmButton) {
  filmButton.hidden = false;
  filmButton.addEventListener('click', () => {
    const source = film.querySelector('source');
    if (!film.poster && film.dataset.poster) film.poster = film.dataset.poster;
    if (source && !source.getAttribute('src')) {
      source.src = source.dataset.src!;
      film.load();
    }
    filmDialog.showModal();
    film.currentTime = 0;
    void film.play().catch(() => { /* Native play remains available if autoplay is restricted. */ });
  });
  filmDialog.addEventListener('close', () => film.pause());
  filmDialog.addEventListener('click', (event) => { if (event.target === filmDialog) filmDialog.close(); });
  film.addEventListener('error', () => {
    const description = filmDialog.querySelector('p');
    if (description) description.textContent = 'The film is unavailable. Close this window to explore the illustrated assembly below.';
  });
}

// Scroll-snap works without JS. The buttons add an accessible alternative to swiping.
const highlights = document.querySelector<HTMLElement>('[data-highlights]');
const highlightControls = document.querySelector<HTMLElement>('[data-highlight-controls]');
if (highlights && highlightControls) {
  highlightControls.hidden = false;
  const buttons = Array.from(highlightControls.querySelectorAll<HTMLButtonElement>('[data-slide]'));
  const update = () => {
    if (buttons[0]) buttons[0].disabled = highlights.scrollLeft < 2;
    if (buttons[1]) buttons[1].disabled = highlights.scrollLeft >= highlights.scrollWidth - highlights.clientWidth - 2;
  };
  buttons.forEach((button) => button.addEventListener('click', () => {
    const card = highlights.querySelector<HTMLElement>('.highlight-card');
    const gap = parseFloat(getComputedStyle(highlights).gap) || 0;
    highlights.scrollBy({ left: ((card?.offsetWidth || 400) + gap) * Number(button.dataset.slide), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }));
  highlights.addEventListener('scroll', update, { passive: true });
  const resize = new ResizeObserver(update);
  resize.observe(highlights);
  update();
}

const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
if (document.querySelector('.hero') && !connection?.saveData && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  void import('./motion').then(({ initMotion }) => initMotion()).catch(() => { /* Static layout remains complete. */ });
}
