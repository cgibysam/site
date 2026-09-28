/* Patty — scroll choreography. Depends on the vendored GSAP, ScrollTrigger and Lenis builds. */
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Smooth scroll */
  var lenis = null;
  if (!reduce && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { duration: 1.4 });
      else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* Video support: fall back to the poster still when H.264 can't play */
  var probe = document.createElement('video');
  var canMp4 = !!probe.canPlayType && probe.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '';
  $$('video').forEach(function (v) {
    var poster = v.getAttribute('poster');
    if (poster) v.style.backgroundImage = 'url("' + poster + '")';
    v.addEventListener('error', function () { v.classList.add('is-fallback'); }, true);
    if (!canMp4) { v.removeAttribute('autoplay'); v.classList.add('is-fallback'); return; }
    if (v.hasAttribute('data-lazy')) {
      ScrollTrigger.create({
        trigger: v, start: 'top 95%', end: 'bottom 5%',
        onEnter: function () { v.play().catch(function () {}); },
        onEnterBack: function () { v.play().catch(function () {}); },
        onLeave: function () { v.pause(); },
        onLeaveBack: function () { v.pause(); }
      });
    }
  });

  /* Nav */
  ScrollTrigger.create({ start: 60, end: 'max', toggleClass: { targets: '#nav', className: 'is-solid' } });

  /* Hero */
  var hero = $('#hero');
  if (hero) {
    var letters = $$('.hero__title span');
    if (!reduce) {
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .from(letters, { yPercent: 105, duration: 1.1, stagger: 0.07 }, 0.1)
        .from(['.hero__inner .eyebrow', '.hero__sub', '.hero__actions', '.hero__cue'], { y: 24, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.5);
      gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
        .to('.hero__video', { scale: 1.15, yPercent: 10, ease: 'none' }, 0)
        .to('.hero__inner', { yPercent: -18, opacity: 0, ease: 'none' }, 0)
        .to('.hero__cue', { opacity: 0, ease: 'none' }, 0);
    }
    var hv = $('.hero__video');
    if (hv) ScrollTrigger.create({
      trigger: hero, start: 'top top', end: 'bottom top',
      onLeave: function () { hv.pause(); },
      onEnterBack: function () { if (!hv.classList.contains('is-fallback')) hv.play().catch(function () {}); }
    });
  }

  /* Generic reveals */
  if (!reduce) {
    $$('[data-reveal]').forEach(function (el) {
      var targets = el.getAttribute('data-reveal') === 'children' ? Array.prototype.slice.call(el.children) : [el];
      gsap.from(targets, { y: 36, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.09,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
  }

  /* Counters */
  $$('[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var plain = el.getAttribute('data-format') === 'plain';
    var fmt = function (n) { return plain ? String(Math.round(n)) : Math.round(n).toLocaleString('en-US'); };
    if (reduce) { el.textContent = fmt(target); return; }
    var o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: function () {
      gsap.to(o, { v: target, duration: 1.8, ease: 'power3.out', onUpdate: function () { el.textContent = fmt(o.v); } });
    } });
  });

  /* Craft: sticky media follows the active step */
  var frames = $$('.craft__frame');
  var setFrame = function (n) {
    frames.forEach(function (f) {
      var on = f.getAttribute('data-step') === String(n);
      f.classList.toggle('is-active', on);
      var v = f.querySelector('video');
      if (v && !v.classList.contains('is-fallback')) { if (on) v.play().catch(function () {}); else v.pause(); }
    });
  };
  $$('.craft__step').forEach(function (step) {
    var n = step.getAttribute('data-step');
    ScrollTrigger.create({ trigger: step, start: 'top 62%', end: 'bottom 38%',
      onEnter: function () { setFrame(n); }, onEnterBack: function () { setFrame(n); } });
  });

  /* Build: the exploded burger assembles as you scroll */
  (function build() {
    var section = $('#build'), stack = $('#stack');
    if (!section || !stack) return;
    var finalImg = $('.stack__final', stack);
    var data = null;
    try { data = JSON.parse($('#layers-data').textContent); } catch (e) { data = null; }
    var layers = data && data.layers && data.layers.length ? data.layers : [];
    var captions = $$('#captions li');
    if (!layers.length || reduce) {
      stack.classList.add('is-static');
      if (finalImg) finalImg.style.opacity = 1;
      return;
    }
    var W = data.width, H = data.height, n = layers.length;
    var imgs = layers.map(function (l, i) {
      var img = new Image();
      img.src = 'assets/img/' + l.file;
      img.alt = '';
      img.className = 'stack__layer';
      img.style.left = (l.x / W * 100) + '%';
      img.style.top = (l.y / H * 100) + '%';
      img.style.width = (l.w / W * 100) + '%';
      img.style.zIndex = String(10 + (n - i));
      stack.insertBefore(img, finalImg);
      return img;
    });
    var size = function () {
      var h = Math.min(window.innerHeight * 0.66, window.innerWidth * 0.92 * H / W);
      stack.style.height = h + 'px';
      stack.style.width = (h * W / H) + 'px';
    };
    size();
    window.addEventListener('resize', size);
    gsap.set(captions, { opacity: 0, y: 10 });

    var wmax = Math.max.apply(null, layers.map(function (l) { return l.w; }));
    var bottom = layers[n - 1];
    var run = function () {
      var aspect = finalImg && finalImg.naturalWidth ? finalImg.naturalHeight / finalImg.naturalWidth : 0.95;
      var assembledH = wmax * aspect;
      var sumH = layers.reduce(function (s, l) { return s + l.h; }, 0);
      var overlap = n > 1 ? Math.max(0, (sumH - assembledH) / (n - 1)) : 0;
      var tops = new Array(n);
      tops[n - 1] = bottom.y;
      for (var i = n - 2; i >= 0; i--) tops[i] = tops[i + 1] - layers[i].h + overlap;
      var shift = H / 2 - (tops[0] + bottom.y + bottom.h) / 2;
      tops = tops.map(function (t) { return t + shift; });
      var blockBottom = tops[n - 1] + bottom.h;
      var cx = layers.reduce(function (s, l) { return s + l.x + l.w / 2; }, 0) / n;
      var finalH = wmax * aspect;
      finalImg.style.width = (wmax / W * 100) + '%';
      finalImg.style.left = ((cx - wmax / 2) / W * 100) + '%';
      finalImg.style.top = ((blockBottom - finalH) / H * 100) + '%';

      var seg = 1;
      var tl = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top top', end: '+=' + (n * 90 + 120) + '%', pin: true, scrub: 0.6, anticipatePin: 1 } });
      for (var k = n - 1; k >= 0; k--) {
        var at = (n - 1 - k) * seg;
        tl.to(imgs[k], { top: (tops[k] / H * 100) + '%', ease: 'power2.inOut', duration: seg * 0.9 }, at);
        if (captions[k]) {
          tl.to(captions[k], { opacity: 1, y: 0, duration: seg * 0.3 }, at + seg * 0.45)
            .to(captions[k], { opacity: 0, y: -8, duration: seg * 0.25 }, at + seg * 0.98);
        }
      }
      var endAt = n * seg;
      tl.to(imgs, { opacity: 0, duration: 0.5 }, endAt)
        .to(finalImg, { opacity: 1, duration: 0.5 }, endAt)
        .to(stack, { scale: 1.05, duration: 1.2, ease: 'power1.out' }, endAt)
        .to({}, { duration: 0.4 });
    };
    if (finalImg && !finalImg.complete) finalImg.addEventListener('load', run, { once: true });
    else run();
  })();

  /* Menu: pinned horizontal track on wide screens */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', function () {
    var section = $('#menu'), pin = $('.menu__pin'), track = $('#menuTrack');
    if (!section || !pin || !track) return;
    var dist = function () {
      var pad = parseFloat(getComputedStyle(pin).paddingLeft) || 0;
      return Math.max(0, track.scrollWidth - (pin.clientWidth - pad * 2));
    };
    var tween = gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.5, invalidateOnRefresh: true, anticipatePin: 1 } });
    $$('.card__media img', track).forEach(function (img) {
      gsap.fromTo(img, { xPercent: -5 }, { xPercent: 5, ease: 'none',
        scrollTrigger: { trigger: img, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
  });
  mm.add('(max-width: 900px) and (prefers-reduced-motion: no-preference)', function () {
    gsap.from('.card', { y: 30, opacity: 0, stagger: 0.08, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '#menuTrack', start: 'top 85%', once: true } });
  });

  /* Sear, visit, footer */
  if (!reduce) {
    gsap.fromTo('.sear__media', { yPercent: -10 }, { yPercent: 10, ease: 'none',
      scrollTrigger: { trigger: '#sear', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.visit__media', { clipPath: 'inset(10% 10% 10% 10% round 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 8px)', ease: 'none',
      scrollTrigger: { trigger: '.visit__media', start: 'top 85%', end: 'top 25%', scrub: true } });
    gsap.fromTo('.visit__media img', { scale: 1.15 }, { scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.visit__media', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.footer__mark', { yPercent: 35 }, { yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
