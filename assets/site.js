/* SendSong: lingua, hero palco, screenshot, copia email. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (!reduce) root.classList.add('anim');
  var params = new URLSearchParams(location.search);
  var LANG_KEY = 'sendsong-lang';

  function sget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  var th = params.get('theme');
  if ((th === 'dark' || th === 'light') && root.getAttribute('data-theme') !== 'stage') {
    root.setAttribute('data-theme', th);
  }

  var lang = 'it';
  var storageOK = true;
  var heroRedraw = null;

  function detectLang() {
    var q = (params.get('lang') || '').toLowerCase().slice(0, 2);
    if (q === 'it' || q === 'en') return q;
    var s = sget(LANG_KEY);
    if (s === 'it' || s === 'en') return s;
    var n = ((navigator.languages && navigator.languages[0]) || navigator.language || 'en').toLowerCase();
    return n.indexOf('it') === 0 ? 'it' : 'en';
  }

  function applyHead(l) {
    var els = document.querySelectorAll('head [data-en]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], isMeta = el.tagName === 'META';
      if (!el.hasAttribute('data-it')) el.setAttribute('data-it', isMeta ? el.getAttribute('content') : el.textContent);
      var val = el.getAttribute('data-' + l);
      if (isMeta) el.setAttribute('content', val); else el.textContent = val;
    }
  }

  function applyLinks() {
    if (storageOK) return;
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var h = links[i].getAttribute('href');
      if (!/^[\w\-./]+\.html(#.*)?$/.test(h)) continue;
      var u = new URL(h, location.href);
      u.searchParams.set('lang', lang);
      links[i].setAttribute('href', u.pathname.split('/').pop() + u.search + u.hash);
    }
  }

  function setLang(l, save) {
    lang = l;
    root.setAttribute('lang', l);
    root.setAttribute('data-lang', l);
    var btns = document.querySelectorAll('[data-set-lang]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-set-lang') === l ? 'true' : 'false');
    }
    applyHead(l);
    var shots = document.querySelectorAll('img[data-shot]');
    for (var k = 0; k < shots.length; k++) {
      var base = shots[k].getAttribute('data-shot');
      var want = 'assets/img/screens/' + base + '.' + l + '.png';
      if (shots[k].getAttribute('src') !== want) shots[k].setAttribute('src', want);
    }
    var alts = document.querySelectorAll('[data-alt-it]');
    for (var a = 0; a < alts.length; a++) alts[a].setAttribute('aria-label', alts[a].getAttribute('data-alt-' + l));
    if (save) storageOK = sset(LANG_KEY, l);
    applyLinks();
    if (typeof window.sendsongApplyCopy === 'function') window.sendsongApplyCopy(lang);
    if (heroRedraw) heroRedraw();
    if (window.sendsongRefreshSupport) window.sendsongRefreshSupport();
    if (window.sendsongRefreshGuide) window.sendsongRefreshGuide();
  }

  setLang(detectLang(), !!params.get('lang'));

  function playPromo() {
    var promo = document.getElementById('promo');
    if (!promo || reduce) return;
    root.classList.remove('going');
    var motions = promo.querySelectorAll('animateMotion');
    for (var i = 0; i < motions.length; i++) {
      try { motions[i].endElement(); } catch (e) { /* already idle */ }
    }
    void promo.offsetWidth;
    root.classList.add('going');
    for (var j = 0; j < motions.length; j++) {
      try { motions[j].beginElement(); } catch (e2) { /* noop */ }
    }
  }

  function initHero() {
    if (!document.getElementById('promo')) return;
    heroRedraw = playPromo;
    playPromo();
  }

  function initCopy() {
    var btns = document.querySelectorAll('[data-copy]');
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        var src = document.getElementById(b.getAttribute('data-copy'));
        if (!src) return;
        var text = src.textContent.trim();
        function done() {
          b.classList.add('done');
          var it = b.querySelector('[data-l="it"]'), en = b.querySelector('[data-l="en"]');
          if (it && en) {
            it.setAttribute('data-keep', it.textContent);
            en.setAttribute('data-keep', en.textContent);
            it.textContent = 'Copiato';
            en.textContent = 'Copied';
          }
          setTimeout(function () {
            b.classList.remove('done');
            if (it && en) {
              it.textContent = it.getAttribute('data-keep');
              en.textContent = en.getAttribute('data-keep');
            }
          }, 1800);
        }
        function fallback() {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;left:-9999px;top:0';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); done(); } catch (e) { /* noop */ }
          document.body.removeChild(ta);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else fallback();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-set-lang]'), function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-set-lang'), true); });
    });
    setLang(lang, false);
    var imgs = document.querySelectorAll('.device img');
    for (var j = 0; j < imgs.length; j++) {
      if (imgs[j].complete && imgs[j].naturalWidth > 0) imgs[j].classList.add('ok');
      else imgs[j].addEventListener('load', function () { this.classList.add('ok'); });
    }
    initHero();
    initCopy();
    initSupportSearch();
    initGuideSearch();
  });

  function supportLang() {
    return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'it';
  }

  function supportText(root) {
    var lang = supportLang();
    var out = [];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var el = node.parentElement;
      if (!el) continue;
      var marked = el.closest('[data-l]');
      if (marked && marked.getAttribute('data-l') !== lang) continue;
      out.push(node.nodeValue);
    }
    return out.join(' ');
  }

  function supportNorm(value) {
    return (value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function initSupportSearch() {
    var input = document.getElementById('support-q');
    var empty = document.getElementById('support-empty');
    if (!input) return;
    var groups = document.querySelectorAll('.faq-group');
    var itPlaceholder = input.getAttribute('placeholder') || '';
    var enPlaceholder = input.getAttribute('data-en-placeholder') || itPlaceholder;
    function apply() {
      input.placeholder = supportLang() === 'en' ? enPlaceholder : itPlaceholder;
      var q = supportNorm(input.value.trim());
      var any = false;
      Array.prototype.forEach.call(groups, function (group) {
        var head = group.querySelector('h2');
        var headMatch = q && head && supportNorm(supportText(head)).indexOf(q) !== -1;
        var shown = 0;
        Array.prototype.forEach.call(group.querySelectorAll('details'), function (item) {
          var ok = !q || headMatch || supportNorm(supportText(item)).indexOf(q) !== -1;
          item.hidden = !ok;
          if (ok) shown += 1;
        });
        group.hidden = shown === 0;
        if (shown) any = true;
      });
      Array.prototype.forEach.call(document.querySelectorAll('.support-jump a'), function (link) {
        var id = (link.getAttribute('href') || '').replace(/^#/, '');
        var group = id ? document.getElementById(id) : null;
        link.hidden = !!(group && group.hidden);
      });
      var jump = document.querySelector('.support-jump');
      if (jump) jump.setAttribute('aria-label', supportLang() === 'en' ? 'Sections' : 'Sezioni');
      if (empty) empty.hidden = any || !q;
    }
    input.addEventListener('input', apply);
    window.sendsongRefreshSupport = apply;
    apply();
  }

  function initGuideSearch() {
    var input = document.getElementById('guide-q');
    var empty = document.getElementById('guide-empty');
    if (!input) return;
    var sections = document.querySelectorAll('section.guide-section');
    var itPlaceholder = input.getAttribute('placeholder') || '';
    var enPlaceholder = input.getAttribute('data-en-placeholder') || itPlaceholder;
    function apply() {
      input.placeholder = supportLang() === 'en' ? enPlaceholder : itPlaceholder;
      var q = supportNorm(input.value.trim());
      var any = false;
      Array.prototype.forEach.call(sections, function (section) {
        var ok = !q || supportNorm(supportText(section)).indexOf(q) !== -1;
        section.hidden = !ok;
        if (ok) any = true;
      });
      Array.prototype.forEach.call(document.querySelectorAll('.guide-toc a'), function (link) {
        var id = (link.getAttribute('href') || '').replace(/^#/, '');
        var section = id ? document.getElementById(id) : null;
        var item = link.closest('li');
        if (item) item.hidden = !!(section && section.hidden);
      });
      var toc = document.querySelector('.guide-toc');
      if (toc) toc.setAttribute('aria-label', supportLang() === 'en' ? 'Guide contents' : 'Indice guida');
      if (empty) empty.hidden = any || !q;
    }
    input.addEventListener('input', apply);
    window.sendsongRefreshGuide = apply;
    apply();
  }
})();
