// Nocturne's decorative film: offscreen and reduced-motion states stay still.
const video = document.querySelector<HTMLVideoElement>('[data-ambient]');
const toggle = document.querySelector<HTMLButtonElement>('[data-ambient-toggle]');
if (video && toggle) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 901px)');
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  let visible = false;
  let userPaused = false;
  let manuallyStarted = false;
  let failed = false;
  video.muted = true;
  toggle.hidden = false;
  const allowed = () => visible && !document.hidden && !userPaused && !failed && (manuallyStarted || (desktop.matches && !reduced.matches && !saveData));
  const label = () => {
    const playing = !video.paused;
    toggle.setAttribute('aria-label', playing ? 'Pause background animation' : 'Play background animation');
    toggle.replaceChildren(document.createTextNode(playing ? 'Pause motion' : 'Play motion'));
    const icon = document.createElement('span'); icon.setAttribute('aria-hidden', 'true'); icon.textContent = playing ? 'Ⅱ' : '\u25B6\uFE0E';
    toggle.append(icon);
  };
  const play = async () => {
    const source = video.querySelector('source');
    if (source && !source.getAttribute('src')) { source.src = source.dataset.src!; video.load(); }
    try { await video.play(); if (!allowed()) video.pause(); } catch { label(); }
  };
  const sync = () => { if (allowed()) void play(); else video.pause(); };
  video.addEventListener('playing', () => {
    if (!allowed()) { video.pause(); return; }
    video.parentElement?.classList.add('is-playing'); label();
  });
  video.addEventListener('pause', label);
  video.addEventListener('error', () => { failed = true; video.parentElement?.classList.remove('is-playing'); toggle.hidden = true; });
  toggle.addEventListener('click', () => {
    if (video.paused) { manuallyStarted = true; userPaused = false; }
    else userPaused = true;
    sync();
  });
  const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); sync(); }, { threshold:.1 });
  observer.observe(video);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => { manuallyStarted = false; sync(); });
  desktop.addEventListener('change', sync);
  window.addEventListener('pagehide', () => video.pause());
  label();
}
