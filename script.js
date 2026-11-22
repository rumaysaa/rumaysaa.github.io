/* Rumaysa Babulkhair: portfolio behaviour. Vanilla JS, no dependencies.
   Animations only touch transform / opacity / clip-path. */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return reduceMQ.matches; };

  /* ---------- Hero: split name into characters for a staggered mask reveal ---------- */
  (function splitHero() {
    var h1 = $('.hero__title');
    if (!h1 || reduced()) return;
    var i = 0;
    h1.setAttribute('aria-label', 'Rumaysa Babulkhair, Software & AI Engineer');
    $$('.line > span', h1).forEach(function (wrap) {
      var targets = wrap.querySelector('em') ? [wrap.querySelector('em')] : [wrap];
      targets.forEach(function (t) {
        Array.prototype.slice.call(t.childNodes).forEach(function (n) {
          if (n.nodeType !== 3 || !n.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          n.textContent.split('').forEach(function (c) {
            var s = document.createElement('span');
            s.className = 'ch'; s.textContent = c;
            s.style.setProperty('--i', i++);
            s.setAttribute('aria-hidden', 'true');
            frag.appendChild(s);
          });
          t.replaceChild(frag, n);
        });
      });
    });
    h1.classList.add('is-split');
  })();

  /* ---------- Theme toggle (View Transitions circle wipe where supported) ---------- */
  var themeBtn = $('#theme-toggle') || document.createElement('button'); // detached stub keeps later code safe
  function currentTheme() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    var m = $('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'light' ? '#f3f0e8' : '#0c0c0b');
    try { localStorage.setItem('theme', t); } catch (e) {}
    document.dispatchEvent(new Event('themechange'));
  }
  themeBtn.setAttribute('aria-label', currentTheme() === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  themeBtn.addEventListener('click', function () {
    var next = currentTheme() === 'light' ? 'dark' : 'light';
    if (reduced()) { applyTheme(next); return; }
    if (document.startViewTransition) {
      var r = themeBtn.getBoundingClientRect();
      root.style.setProperty('--tx', (r.left + r.width / 2) + 'px');
      root.style.setProperty('--ty', (r.top + r.height / 2) + 'px');
      root.classList.add('no-trans'); // keep colours from cross-fading inside the wipe
      var vt = document.startViewTransition(function () { applyTheme(next); });
      var clean = function () { root.classList.remove('no-trans'); };
      vt.finished.then(clean, clean);
    } else {
      // Fallback: briefly cross-fade colours
      root.classList.add('theme-anim');
      applyTheme(next);
      setTimeout(function () { root.classList.remove('theme-anim'); }, 600);
    }
  });

  /* ---------- Scroll progress ---------- */
  var bar = $('#progress'), ticking = false;
  function updateProgress() {
    var max = root.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  /* ---------- Mobile menu (focus trap, Escape, animated) ---------- */
  var menu = $('#menu') || document.createElement('div'), menuBtn = $('#menu-btn') || document.createElement('button'), closeTimer;
  if (!menu.parentNode) menu.hidden = true;
  function focusables() { return $$('a[href], button', menu).concat([menuBtn, themeBtn]); }
  function openMenu() {
    clearTimeout(closeTimer);
    menu.hidden = false;
    void menu.offsetWidth; // flush so the transition runs
    menu.classList.add('open');
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('menu-open');
    var first = $('a', menu); if (first) first.focus();
  }
  function closeMenu(returnFocus) {
    menu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
    closeTimer = setTimeout(function () { menu.hidden = true; }, reduced() ? 0 : 650);
    if (returnFocus) menuBtn.focus();
  }
  menuBtn.addEventListener('click', function () {
    menuBtn.getAttribute('aria-expanded') === 'true' ? closeMenu(false) : openMenu();
  });
  $$('a', menu).forEach(function (a, i) {
    a.style.setProperty('--i', i);
    a.addEventListener('click', function () { closeMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (menu.hidden) return;
    if (e.key === 'Escape') { closeMenu(true); return; }
    if (e.key !== 'Tab') return;
    var f = focusables().filter(function (el) { return el.offsetParent !== null; });
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  window.matchMedia('(min-width: 861px)').addEventListener('change', function (e) {
    if (e.matches && !menu.hidden) closeMenu(false);
  });

  /* ---------- Scroll reveals (clip-path + translate + opacity), staggered siblings ---------- */
  var revealEls = $$('.reveal');
  $$('.tl, .kit, .certs ul').forEach(function (group) {
    $$('.reveal, li', group).forEach(function (el, i) { el.style.setProperty('--rd', (i * 90) + 'ms'); });
  });
  if ('IntersectionObserver' in window && !reduced()) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
    // Safety net: reveal anything already in view that the observer missed
    var sweep = function () {
      revealEls.forEach(function (el) {
        if (el.classList.contains('in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.95 && r.bottom > 0) { el.classList.add('in'); io.unobserve(el); }
      });
    };
    setTimeout(sweep, 2500);
    window.addEventListener('scroll', function () { clearTimeout(sweep.t); sweep.t = setTimeout(sweep, 400); }, { passive: true });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Active section in nav ---------- */
  // Only in-page anchors ("#work") are observed; on project pages the links point to ../index.html#x
  // and "Work" is marked aria-current statically in the markup.
  var links = $$('.nav a[data-nav]').filter(function (a) { return (a.getAttribute('href') || '').charAt(0) === '#'; });
  if (links.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) spy.observe(s); });
  }

  /* ---------- Local video: custom play overlay ---------- */
  var video = $('#demo'), play = $('#play'), screen = $('#player');
  if (video && play) {
    play.addEventListener('click', function () {
      var p = video.play();
      if (p && p.catch) p.catch(function () { screen.classList.remove('playing'); });
    });
    video.addEventListener('play', function () { video.controls = true; screen.classList.add('playing'); });
    video.addEventListener('ended', function () { video.controls = false; screen.classList.remove('playing'); });
  }

  /* ---------- Featured project: subtle pointer tilt on the browser frame ---------- */
  (function tilt() {
    var el = $('.browser');
    if (!el || reduced() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var raf = 0, rx = 0, ry = 0;
    function paint() { raf = 0; el.style.setProperty('--rx', rx + 'deg'); el.style.setProperty('--ry', ry + 'deg'); }
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      ry = ((e.clientX - r.left) / r.width - 0.5) * 3.2;
      rx = -((e.clientY - r.top) / r.height - 0.5) * 3.2;
      if (!raf) raf = requestAnimationFrame(paint);
    });
    el.addEventListener('pointerleave', function () { rx = 0; ry = 0; if (!raf) raf = requestAnimationFrame(paint); });
  })();

  /* ---------- References: full recommendation disclosure ---------- */
  var refBtn = $('#ref-toggle');
  if (refBtn) refBtn.addEventListener('click', function () {
    var open = refBtn.getAttribute('aria-expanded') !== 'true';
    refBtn.setAttribute('aria-expanded', String(open));
    $('.ref__toggle-t', refBtn).textContent = open ? 'Show less' : 'Read the full recommendation';
    $('.ref__body').classList.toggle('open', open);
  });

  /* ---------- Copy email ---------- */
  var mail = $('#copy-mail'), status = $('#copy-status'), copyTimer;
  if (mail) mail.addEventListener('click', function () {
    var text = mail.getAttribute('data-email');
    function done() {
      mail.classList.add('copied');
      status.textContent = 'Email address copied to clipboard';
      clearTimeout(copyTimer);
      copyTimer = setTimeout(function () { mail.classList.remove('copied'); status.textContent = ''; }, 2200);
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
      document.body.appendChild(ta); ta.select();
      try { if (document.execCommand('copy')) done(); } catch (e) {}
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  });

  /* ---------- Email links: open mail app AND copy address, with a toast ----------
     mailto: does nothing for visitors without a desktop mail app (e.g. Gmail-in-browser
     users), so we always copy the address too and tell them. */
  var toast = $('#toast'), toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 4200);
  }
  function copyText(text, ok) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
      document.body.appendChild(ta); ta.select();
      try { if (document.execCommand('copy')) ok(); } catch (e) {}
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fallback);
    else fallback();
  }
  $$('a[href^="mailto:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      var addr = a.getAttribute('href').replace(/^mailto:/, '').split('?')[0];
      copyText(addr, function () {
        showToast('Copied ' + addr + ' — if no mail app opened, paste it into your email.');
      });
      // default navigation to mailto: still happens, opening the mail app where one exists
    });
  });

  /* ---------- Footer: year + live Dublin time ---------- */
  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
  var clock = $('#dublin-time');
  function tick() {
    try {
      clock.textContent = new Intl.DateTimeFormat('en-IE', { timeZone: 'Europe/Dublin', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
    } catch (e) { clock.textContent = ''; }
  }
  if (clock) { tick(); setInterval(tick, 15000); }

  /* ---------- Screenshot sliders (project pages) ----------
     Native scroll-snap does the swiping; this adds buttons, dots, a counter and arrow keys. */
  $$('[data-slider]').forEach(function (root) {
    var track = $('.slider__track', root), slides = $$('.slider__slide', root);
    var prev = $('[data-prev]', root), next = $('[data-next]', root);
    var cur = $('[data-cur]', root), total = $('[data-total]', root), dotsWrap = $('.slider__dots', root);
    if (!track || !slides.length) return;
    var pad = function (n) { return ('0' + n).slice(-2); };
    if (total) total.textContent = pad(slides.length);
    var dots = slides.map(function (s, i) {
      var d = document.createElement('button');
      d.type = 'button'; d.className = 'slider__dot';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', 'Show screenshot ' + (i + 1));
      d.addEventListener('click', function () { go(i); });
      if (dotsWrap) dotsWrap.appendChild(d);
      return d;
    });
    var index = 0;
    function go(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: reduced() ? 'auto' : 'smooth' });
    }
    function sync() {
      var i = Math.round(track.scrollLeft / track.clientWidth);
      if (i === index) return;
      index = i;
      if (cur) cur.textContent = pad(i + 1);
      dots.forEach(function (d, k) { d.setAttribute('aria-selected', String(k === i)); });
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
      // highlight the Admin / Employee switch for the group this slide belongs to
      var grp = slides[i] && slides[i].getAttribute('data-group');
      groups.forEach(function (g) {
        var target = slides[+g.getAttribute('data-goto')];
        g.setAttribute('aria-pressed', String(!!target && target.getAttribute('data-group') === grp));
      });
    }
    var groups = $$('[data-goto]', root);
    groups.forEach(function (g) { g.addEventListener('click', function () { go(+g.getAttribute('data-goto')); }); });
    var raf = 0;
    track.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; sync(); }); }, { passive: true });
    if (prev) prev.addEventListener('click', function () { go(index - 1); });
    if (next) next.addEventListener('click', function () { go(index + 1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    });
    window.addEventListener('resize', function () { go(index); });
    index = -1; sync();
  });

  /* ---------- RAG pipeline diagram ---------- */
  var stage = $('#pipeline');
  if (!stage) return;
  var NS = 'http://www.w3.org/2000/svg';
  // label/sub are drawn inside the nodes (keep short); name/text drive the caption below.
  var STAGES = [
    { label: 'upload',   sub: 'notes · policies', g: 'docs',  name: 'Upload',
      text: 'Lecture notes, slides or legal policies go in (OCR for handwriting).' },
    { label: 'split',    sub: 'passages',       g: 'chunk', name: 'Split',
      text: 'Text is cut into short passages.' },
    { label: 'embed',    sub: 'as vectors',     g: 'embed', name: 'Embed',
      text: 'Each passage becomes a vector that captures its meaning.' },
    { label: 'retrieve', sub: 'best matches',   g: 'find',  name: 'Retrieve',
      text: 'A question pulls out the closest-matching passages.' },
    { label: 'generate', sub: 'private LLM',    g: 'chip',  name: 'Generate',
      text: 'An LLM reads only those passages, and the data stays private.' },
    { label: 'answer',   sub: 'grounded reply', g: 'text',  name: 'Answer',
      text: 'Out comes a grounded answer: a policy lookup, a summary or a quiz.' }
  ];
  var stepEl = $('#pipe-step'), textEl = $('#pipe-text'), shownStep = -1;
  function showStep(i) {
    if (i === shownStep || !stepEl || !textEl) return;
    shownStep = i;
    stepEl.textContent = ('0' + (i + 1)).slice(-2) + ' / ' + STAGES[i].name;
    textEl.textContent = STAGES[i].text;
    var leg = $('#pipe-legend');
    if (leg && !reduced()) { leg.classList.remove('swap'); void leg.offsetWidth; leg.classList.add('swap'); }
  }
  // Glyphs are drawn around (0,0) in roughly a 40x26 box.
  var GLYPH = {
    docs:  'M-12 -12h14l6 6v18h-20z M2 -12v6h6 M-8 0h10 M-8 5h10 M-16 -8v22h14',
    chunk: 'M-20 -11h12v8h-12z M-6 -11h12v8h-12z M8 -11h12v8h-12z M-13 3h12v8h-12z M1 3h12v8h-12z',
    embed: 'M-17 9v-8 M-10 9v-17 M-3 9v-10 M4 9v-21 M11 9v-13 M18 9v-6',
    find:  'M-13 -2a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M2 5l9 8',
    chip:  'M-9 -9h18v18h-18z M-4 -4h8v8h-8z M-5 -9v-4 M0 -9v-4 M5 -9v-4 M-5 9v4 M0 9v4 M5 9v4 M-9 -5h-4 M-9 0h-4 M-9 5h-4 M9 -5h4 M9 0h4 M9 5h4',
    text:  'M-17 -8h34 M-17 -1h34 M-17 6h20'
  };
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, cls, x, y, anchor, str) {
    var t = el('text', { 'class': cls, x: x, y: y, 'text-anchor': anchor }, parent);
    t.textContent = str; return t;
  }

  var svg, nodes, parts, orient, paused = false, visible = false, rafId = 0, last = 0, clock0 = 0;

  function build() {
    orient = window.matchMedia('(min-width: 1000px)').matches ? 'h' : 'v';
    stage.setAttribute('data-orient', orient);
    stage.textContent = '';
    var H = orient === 'h';
    var W = H ? 1200 : 340, VH = H ? 330 : 616;
    svg = el('svg', { viewBox: '0 0 ' + W + ' ' + VH, 'aria-hidden': 'true', focusable: 'false' }, stage);
    var rails = el('g', {}, svg), nodeLayer = el('g', {}, svg), dotLayer = el('g', {}, svg);
    var n = STAGES.length, nw = H ? 128 : 316, nh = H ? 96 : 60, pos = [];
    for (var i = 0; i < n; i++) {
      pos.push(H ? { x: 24 + nw / 2 + i * ((W - 48 - nw) / (n - 1)), y: 130 } : { x: W / 2, y: 40 + i * 104 });
    }
    nodes = pos.map(function (p, i) {
      var g = el('g', { 'class': 'p-node', transform: 'translate(' + p.x + ' ' + p.y + ')' }, nodeLayer);
      el('rect', { 'class': 'box', x: -nw / 2, y: -nh / 2, width: nw, height: nh, rx: 2 }, g);
      var gl = el('path', { 'class': 'p-glyph', d: GLYPH[STAGES[i].g] }, g);
      var num = ('0' + (i + 1)).slice(-2);
      if (H) {
        gl.setAttribute('transform', 'translate(0 -17)');
        txt(g, 'p-label', 0, 22, 'middle', STAGES[i].label);
        txt(g, 'p-sub', 0, 38, 'middle', STAGES[i].sub);
        txt(g, 'p-idx', -nw / 2, -nh / 2 - 10, 'start', num);
      } else {
        gl.setAttribute('transform', 'translate(' + (-nw / 2 + 44) + ' 0)');
        txt(g, 'p-label', -nw / 2 + 92, -3, 'start', STAGES[i].label);
        txt(g, 'p-sub', -nw / 2 + 92, 15, 'start', STAGES[i].sub);
        txt(g, 'p-idx', nw / 2 - 14, 4, 'end', num);
      }
      return g;
    });

    // Segments between consecutive nodes
    var segs = [];
    for (var s = 0; s < n - 1; s++) {
      var a = pos[s], b = pos[s + 1];
      segs.push(H
        ? { d: 'M' + (a.x + nw / 2) + ' ' + a.y + 'L' + (b.x - nw / 2) + ' ' + b.y, kind: s }
        : { d: 'M' + a.x + ' ' + (a.y + nh / 2) + 'L' + b.x + ' ' + (b.y - nh / 2), kind: s });
    }
    // Query branch feeding retrieval (horizontal layout only)
    if (H) {
      var r = pos[3], qy = 276;
      var q = el('g', { 'class': 'p-node', transform: 'translate(' + r.x + ' ' + qy + ')' }, nodeLayer);
      el('rect', { 'class': 'box', x: -72, y: -18, width: 144, height: 36, rx: 2 }, q);
      txt(q, 'p-sub', 0, 4, 'middle', 'your question');
      segs.push({ d: 'M' + r.x + ' ' + (qy - 18) + 'L' + r.x + ' ' + (r.y + nh / 2), kind: 5 });
    }

    parts = [];
    segs.forEach(function (sg) {
      var path = el('path', { 'class': 'p-rail', d: sg.d }, rails);
      var len = path.getTotalLength(), cnt = Math.max(2, Math.floor(len / 30));
      for (var k = 0; k < cnt; k++) {
        var hot = sg.kind >= 3;
        var node = sg.kind < 2
          ? el('rect', { 'class': 'p-dot' + (hot ? ' hot' : ''), x: sg.kind ? -3 : -4.5, y: sg.kind ? -3 : -5.5, width: sg.kind ? 6 : 9, height: sg.kind ? 6 : 11, rx: 1 }, dotLayer)
          : el('circle', { 'class': 'p-dot' + (hot ? ' hot' : ''), r: sg.kind === 2 ? 2.6 : 3.4 }, dotLayer);
        parts.push({ path: path, len: len, node: node, phase: k / cnt, seg: sg.kind });
      }
    });
    render(clock0);
  }

  var SPEED = 70; // svg units per second
  function render(t) {
    parts.forEach(function (p) {
      var u = (p.phase + (t * SPEED) / p.len) % 1;
      var pt = p.path.getPointAtLength(u * p.len);
      p.node.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
      p.node.setAttribute('opacity', Math.min(1, u * 6, (1 - u) * 6).toFixed(2));
    });
    if (!reduced()) {
      var act = Math.floor(t / 2.6) % nodes.length; // slow enough to read each caption
      nodes.forEach(function (g, i) { g.classList.toggle('on', i === act); });
      showStep(act);
    }
  }
  function running() { return visible && !paused && !reduced() && !document.hidden; }
  function frame(now) {
    if (!last) last = now;
    clock0 += Math.min(0.1, (now - last) / 1000); // clamp so a stalled tab doesn't jump ahead
    last = now;
    render(clock0);
    // Continue the loop directly. (Calling schedule() here used to reset `last`
    // every frame, so the clock never advanced and the diagram stood still.)
    rafId = running() ? requestAnimationFrame(frame) : 0;
  }
  function schedule() {
    var go = running();
    if (go && !rafId) { last = 0; rafId = requestAnimationFrame(frame); }
    if (!go && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }

  build();
  if (reduced()) {
    clock0 = 1.6; render(clock0);
    // No cycling caption without motion: summarise all six steps instead.
    if (stepEl && textEl) {
      stepEl.textContent = '6 steps';
      textEl.textContent = STAGES.map(function (s) { return s.name; }).join(' → ');
    }
  }
  window.matchMedia('(min-width: 1000px)').addEventListener('change', build);
  if ('IntersectionObserver' in window) {
    // Use the newest entry: one callback can batch several for the same target.
    new IntersectionObserver(function (e) { visible = e[e.length - 1].isIntersecting; schedule(); }).observe(stage);
  } else { visible = true; schedule(); }
  document.addEventListener('visibilitychange', schedule);
  reduceMQ.addEventListener('change', function () { toggleBtnVisibility(); schedule(); });

  var pBtn = $('#pipe-toggle');
  function toggleBtnVisibility() { if (pBtn) pBtn.hidden = reduced(); }
  toggleBtnVisibility();
  if (pBtn) pBtn.addEventListener('click', function () {
    paused = !paused;
    pBtn.setAttribute('aria-pressed', String(paused));
    pBtn.textContent = paused ? 'Play animation' : 'Pause animation';
    schedule();
  });
})();
