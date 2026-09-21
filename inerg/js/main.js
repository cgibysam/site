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

  /* Nav turns solid once the hero is gone */
  var hero = $('#hero');
  ScrollTrigger.create({ trigger: hero, start: 'bottom 80px', end: 'max', toggleClass: { targets: '#nav', className: 'is-solid' } });

  /* Hero: the period is a drop that falls onto the line under the hero; the line fills to the left and becomes the rail */
  var drop = $('#drop'), landing = $('#landing'), landingFill = $('#landingFill'), railEl = $('#rail');
  var placeRail = function () { if (railEl && landing) railEl.style.top = (landing.getBoundingClientRect().top + window.scrollY) + 'px'; };
  placeRail();
  if (hero && drop && landing && landingFill) {
    var fallDistance = function () { return landing.getBoundingClientRect().top - drop.getBoundingClientRect().bottom + 1; };
    var setFillOrigin = function () { var d = drop.getBoundingClientRect(); landingFill.style.width = (d.left + d.width / 2) + 'px'; };
    if (!reduce) {
      gsap.from($$('.hero__inner > *'), { y: 30, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.1 });
      setFillOrigin();
      gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5, invalidateOnRefresh: true, onRefresh: function () { setFillOrigin(); placeRail(); } } })
        .to(drop, { y: function () { return fallDistance(); }, scaleY: 1.25, ease: 'power1.in', duration: 0.62 }, 0)
        .to(drop, { scaleY: 1, duration: 0.08 }, 0.62)
        .to(landingFill, { scaleX: 1, ease: 'none', duration: 0.38 }, 0.62)
        .to('.hero__media', { yPercent: 12, ease: 'none', duration: 1 }, 0);
    } else {
      landingFill.style.transform = 'scaleX(1)';
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
      marks.forEach(function (m) { m.el.style.top = (m.sec.getBoundingClientRect().top + window.scrollY - railTop + 8) + 'px'; });
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
    ScrollTrigger.create({ onUpdate: updateRail, onRefresh: function () { placeRail(); placeMarks(); updateRail(); } });
    window.addEventListener('resize', function () { placeRail(); placeMarks(); updateRail(); });
    window.addEventListener('load', function () { placeRail(); placeMarks(); updateRail(); });
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

  /* Rooftop parallax and footer wordmark */
  if (!reduce) {
    gsap.fromTo('.power__media', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '#power', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.footer__mark', { yPercent: 30 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
