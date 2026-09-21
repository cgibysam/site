/* INER-G — scroll choreography and theme toggle. Depends on the vendored GSAP, ScrollTrigger and Lenis builds. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;

  /* Theme toggle (light / dark), remembered per browser */
  var toggle = $('#themeToggle');
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  var currentTheme = function () {
    var t = root.getAttribute('data-theme');
    return t === 'dark' || t === 'light' ? t : (systemDark.matches ? 'dark' : 'light');
  };
  var labelToggle = function () {
    if (toggle) toggle.setAttribute('aria-label', currentTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  };
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('inerg-theme', next); } catch (e) {}
      labelToggle();
    });
    labelToggle();
  }

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      if (lenis) lenis.scrollTo(el, { duration: 1.3, offset: -72 });
      else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* Videos: poster fallback when H.264 is unavailable, lazy play in view */
  var probe = document.createElement('video');
  var canMp4 = !!probe.canPlayType && probe.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '';
  $$('video').forEach(function (v) {
    var poster = v.getAttribute('poster');
    if (poster) v.style.backgroundImage = 'url("' + poster + '")';
    v.addEventListener('error', function () { v.classList.add('is-fallback'); }, true);
    if (!canMp4) { v.removeAttribute('autoplay'); v.classList.add('is-fallback'); return; }
    ScrollTrigger.create({
      trigger: v, start: 'top 95%', end: 'bottom 5%',
      onEnter: function () { v.play().catch(function () {}); },
      onEnterBack: function () { v.play().catch(function () {}); },
      onLeave: function () { v.pause(); },
      onLeaveBack: function () { v.pause(); }
    });
  });

  /* Nav */
  ScrollTrigger.create({ start: 40, end: 'max', toggleClass: { targets: '#nav', className: 'is-solid' } });

  /* Hero: the bottle tilts and pours into the rail as the hero scrolls away */
  var hero = $('#hero'), bottle = $('#bottle'), pour = $('#pour'), pourPath = $('#pourPath');
  var railX = function () { return parseFloat(getComputedStyle($('#rail')).left) + 1.5; };
  var drawPour = function () {
    if (!hero || !bottle || !pourPath) return 0;
    var hr = hero.getBoundingClientRect(), br = bottle.getBoundingClientRect();
    var h = br.height, cx = br.left - hr.left + br.width / 2, top = br.top - hr.top;
    // Neck position once the bottle has tilted -28deg around its base
    var nx = cx - 0.36 * h, ny = top + 0.17 * h;
    var ex = railX(), ey = hr.height;
    var d = 'M' + nx.toFixed(1) + ' ' + ny.toFixed(1) +
      ' C' + (nx - 0.15 * h).toFixed(1) + ' ' + (ny + 0.55 * h).toFixed(1) + ' ' + (ex + 60).toFixed(1) + ' ' + (ey - 220).toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1);
    pourPath.setAttribute('d', d);
    var len = pourPath.getTotalLength();
    pourPath.style.strokeDasharray = len;
    return len;
  };
  if (hero && bottle) {
    if (!reduce) {
      gsap.from(bottle, { y: 60, rotation: 6, duration: 1.4, ease: 'expo.out' });
      gsap.from($$('.hero__copy > *'), { y: 30, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.1 });
      var pourLen = drawPour();
      var heroTl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 30%', scrub: 0.6, invalidateOnRefresh: true, onRefresh: function () { pourLen = drawPour(); pourPath.style.strokeDashoffset = pourLen; } } });
      pourPath.style.strokeDashoffset = pourLen;
      heroTl.to(bottle, { rotation: -28, y: 40, ease: 'none' }, 0)
        .to('.hero__copy', { y: -60, ease: 'none' }, 0)
        .to(pourPath, { strokeDashoffset: 0, ease: 'none', duration: 0.7 }, 0.2)
        .to('.hero__tag', { y: 20, ease: 'none' }, 0);
    } else if (pour) {
      pour.style.display = 'none';
    }
  }

  /* Rail: grows with scroll; markers light up as sections arrive */
  var rail = $('#rail'), railFill = $('.rail__fill');
  var marks = [];
  if (rail && railFill) {
    $$('[data-rail]').forEach(function (sec) {
      var m = document.createElement('div');
      m.className = 'rail__mark';
      m.innerHTML = '<span>' + sec.getAttribute('data-rail') + '</span>';
      rail.appendChild(m);
      marks.push({ el: m, sec: sec });
    });
    var placeMarks = function () {
      var railTop = rail.getBoundingClientRect().top + window.scrollY;
      marks.forEach(function (m) {
        var top = m.sec.getBoundingClientRect().top + window.scrollY - railTop + 8;
        m.el.style.top = top + 'px';
      });
    };
    var updateRail = function () {
      var r = rail.getBoundingClientRect();
      var railTop = r.top + window.scrollY, railH = r.height || 1;
      var tip = window.scrollY + window.innerHeight * 0.55 - railTop;
      var p = Math.max(0, Math.min(1, tip / railH));
      railFill.style.transform = 'scaleY(' + p + ')';
      marks.forEach(function (m) { m.el.classList.toggle('is-lit', tip >= parseFloat(m.el.style.top || '0')); });
    };
    placeMarks();
    updateRail();
    ScrollTrigger.create({ onUpdate: updateRail, onRefresh: function () { placeMarks(); updateRail(); } });
    window.addEventListener('resize', function () { placeMarks(); updateRail(); });
    window.addEventListener('load', function () { placeMarks(); updateRail(); });
  }

  /* Transform-only reveals: nothing waits invisible */
  if (!reduce) {
    $$('[data-reveal]').forEach(function (el) {
      var targets = el.getAttribute('data-reveal') === 'children' ? Array.prototype.slice.call(el.children) : [el];
      gsap.from(targets, { y: 44, duration: 1, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  }

  /* Counters */
  $$('[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };
    if (reduce) { el.textContent = fmt(target); return; }
    var o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: function () {
      gsap.to(o, { v: target, duration: 1.6, ease: 'power3.out', onUpdate: function () { el.textContent = fmt(o.v); } });
    } });
  });

  /* Process track: the line fills and the drop travels as the steps scroll in */
  var steps = $('#steps'), stepsFill = $('#stepsFill'), stepsDrop = $('#stepsDrop');
  if (steps && stepsFill && stepsDrop) {
    var narrow = window.matchMedia('(max-width: 960px)');
    var setProgress = function (p) {
      if (narrow.matches) {
        stepsFill.style.transform = 'scaleY(' + p + ')';
        stepsDrop.style.transform = 'translateY(' + (p * steps.getBoundingClientRect().height - 8) + 'px) rotate(-45deg)';
      } else {
        stepsFill.style.transform = 'scaleX(' + p + ')';
        stepsDrop.style.transform = 'translateX(' + (p * steps.getBoundingClientRect().width - 8) + 'px) rotate(-45deg)';
      }
    };
    if (reduce) setProgress(1);
    else ScrollTrigger.create({ trigger: steps, start: 'top 80%', end: 'bottom 45%', scrub: 0.4, onUpdate: function (self) { setProgress(self.progress); } });
  }

  /* Rooftop parallax */
  if (!reduce) gsap.fromTo('.power__media', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '#power', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* Story: the big year follows the milestone in view */
  var yearEl = $('#storyYear'), captionEl = $('#storyCaption');
  if (yearEl) {
    var shown = { v: 1989 };
    var setYear = function (li) {
      var y = parseInt(li.getAttribute('data-year'), 10);
      if (captionEl) captionEl.textContent = li.getAttribute('data-caption') || '';
      if (reduce) { yearEl.textContent = y; return; }
      gsap.to(shown, { v: y, duration: 0.7, ease: 'power2.out', overwrite: true, onUpdate: function () { yearEl.textContent = Math.round(shown.v); } });
    };
    $$('.mile').forEach(function (li) {
      ScrollTrigger.create({ trigger: li, start: 'top 60%', end: 'bottom 60%', onEnter: function () { setYear(li); }, onEnterBack: function () { setYear(li); } });
      if (!reduce) gsap.from(li, { y: 32, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: li, start: 'top 88%', once: true } });
    });
  }

  /* Footer wordmark */
  if (!reduce) gsap.fromTo('.footer__mark', { yPercent: 30 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
