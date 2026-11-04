/* SendSong: lingua, hero palco, screenshot, copia email. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var params = new URLSearchParams(location.search);
  var LANG_KEY = 'sendsong-lang';

  function sget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  var th = params.get('theme');
  if (th === 'dark' || th === 'light') root.setAttribute('data-theme', th);

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
    if (heroRedraw) heroRedraw();
  }

  setLang(detectLang(), !!params.get('lang'));

  function fitCanvas(c) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return null;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    var ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  var COPY = {
    it: { ora: 'ORA', next: 'PROSSIMO', song: 'Notte stellata', nextSong: 'Blues del jazz', master: 'MASTER', monitor: 'MONITOR' },
    en: { ora: 'NOW', next: 'NEXT', song: 'Starry Night', nextSong: 'Jazz Blues', master: 'MASTER', monitor: 'MONITOR' }
  };

  function drawStageHero(ctx, w, h, t, staticFrame) {
    var tx = COPY[lang] || COPY.it;
    var cycle = staticFrame ? 0.72 : (t % 4) / 4;
    var fly = Math.min(1, cycle / 0.38);
    var show = cycle >= 0.38 ? Math.min(1, (cycle - 0.38) / 0.12) : 0;
    var padBottom = 20;
    var usableH = h - padBottom;

    var bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#12131A');
    bg.addColorStop(1, '#0A0B0F');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    var spot = ctx.createRadialGradient(w * 0.55, h * 0.35, 0, w * 0.55, h * 0.35, w * 0.55);
    spot.addColorStop(0, 'rgba(228,1,109,.12)');
    spot.addColorStop(1, 'rgba(228,1,109,0)');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, w, h);

    var mW = Math.min(w * 0.2, 72);
    var mH = mW * 2.05;
    var mX = w * 0.26;
    var mY = usableH * 0.44;

    var tW = Math.min(w * 0.52, usableH * 1.05);
    var tH = tW * 0.68;
    var tX = w * 0.72;
    var tY = usableH * 0.4;

    function deviceFrame(cx, cy, dw, dh, corner, label, drawScreen) {
      var x = cx - dw / 2;
      var y = cy - dh / 2;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.45)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#14151C';
      ctx.strokeStyle = 'rgba(90,92,104,.85)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, x, y, dw, dh, corner);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.stroke();
      var pad = dw * 0.07;
      var sx = x + pad;
      var sy = y + pad;
      var sw = dw - pad * 2;
      var sh = dh - pad * 2;
      ctx.fillStyle = '#0A0B0F';
      roundRect(ctx, sx, sy, sw, sh, corner * 0.65);
      ctx.fill();
      ctx.strokeStyle = 'rgba(43,45,55,.9)';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (drawScreen) drawScreen(sx, sy, sw, sh);
      ctx.restore();
      ctx.fillStyle = 'rgba(163,165,178,.75)';
      ctx.font = '700 ' + Math.max(9, dw * 0.1) + 'px "Roboto Condensed", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, cx, y + dh + 6);
    }

    function masterScreen(sx, sy, sw, sh) {
      ctx.fillStyle = '#16171D';
      ctx.fillRect(sx, sy, sw, sh);
      ctx.fillStyle = '#E4016D';
      ctx.fillRect(sx, sy + sh * 0.18, sw * 0.06, sh * 0.12);
      ctx.fillStyle = '#F3F3F6';
      ctx.font = '700 ' + Math.max(8, sw * 0.09) + 'px "Roboto Condensed", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(tx.song, sx + sw * 0.12, sy + sh * 0.22);
      ctx.fillStyle = '#5E606B';
      for (var i = 0; i < 3; i++) {
        ctx.fillRect(sx + sw * 0.1, sy + sh * (0.38 + i * 0.14), sw * 0.8, sh * 0.06);
      }
    }

    function monitorScreen(sx, sy, sw, sh, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#0E0F13';
      ctx.fillRect(sx, sy, sw, sh);
      ctx.fillStyle = '#FF4FA3';
      ctx.font = '800 ' + Math.max(10, sw * 0.11) + 'px "Roboto Condensed", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(tx.ora, sx + sw * 0.08, sy + sh * 0.22);
      ctx.fillStyle = '#F3F3F6';
      var titleSize = Math.max(11, sw * 0.13);
      ctx.font = '800 ' + titleSize + 'px "Roboto Condensed", sans-serif';
      ctx.fillText(tx.song, sx + sw * 0.08, sy + sh * 0.48, sw * 0.84);
      ctx.fillStyle = '#A3A5B2';
      ctx.font = '600 ' + Math.max(8, sw * 0.07) + 'px "Roboto Condensed", sans-serif';
      ctx.fillText(tx.next + ' · ' + tx.nextSong, sx + sw * 0.08, sy + sh * 0.78, sw * 0.84);
      ctx.restore();
    }

    deviceFrame(mX, mY, mW, mH, mW * 0.14, tx.master, masterScreen);

    var monAlpha = staticFrame ? 1 : show;
    deviceFrame(tX, tY, tW, tH, tW * 0.06, tx.monitor, function (sx, sy, sw, sh) {
      if (monAlpha > 0.01) monitorScreen(sx, sy, sw, sh, monAlpha);
      else {
        ctx.fillStyle = '#0E0F13';
        ctx.fillRect(sx, sy, sw, sh);
      }
    });

    if (!staticFrame && fly < 1) {
      var ease = fly < 0.5 ? 2 * fly * fly : 1 - Math.pow(-2 * fly + 2, 2) / 2;
      var cx = mX + (tX - mX) * ease;
      var cy = mY - mH * 0.05 - Math.sin(ease * Math.PI) * h * 0.12;
      var cardW = mW * 0.85;
      var cardH = cardW * 0.52;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.12 + ease * 0.1);
      ctx.shadowColor = 'rgba(228,1,109,.5)';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#1E2028';
      roundRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 7);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#E4016D';
      ctx.fillRect(-cardW / 2, -cardH / 2, cardW, cardH * 0.14);
      ctx.fillStyle = '#F3F3F6';
      ctx.font = '800 ' + Math.max(9, cardW * 0.14) + 'px "Roboto Condensed", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tx.ora, 0, -cardH * 0.08);
      ctx.restore();

      ctx.strokeStyle = 'rgba(255,79,163,.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 8]);
      ctx.beginPath();
      ctx.moveTo(mX + mW * 0.2, mY - mH * 0.1);
      ctx.quadraticCurveTo((mX + tX) / 2, mY - h * 0.22, tX - tW * 0.15, tY - tH * 0.05);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function initHero() {
    var c = document.getElementById('scene');
    if (!c || !c.getContext) return;
    var t0 = performance.now(), running = false, raf = 0, visible = true;
    function frame(ts) {
      var f = fitCanvas(c);
      if (!f) return;
      drawStageHero(f.ctx, f.w, f.h, (ts - t0) / 1000, reduce);
    }
    heroRedraw = function () { frame(performance.now()); };
    function loop(ts) {
      if (!running) return;
      frame(ts);
      raf = requestAnimationFrame(loop);
    }
    function start() {
      if (running || reduce || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() { running = false; cancelAnimationFrame(raf); }
    frame(t0);
    window.addEventListener('resize', function () { frame(performance.now()); });
    if (reduce) return;
    start();
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible) start(); else stop();
      }).observe(c);
    }
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
  });
})();
