/*
 * Napisy odręczne (handwrite overlay).
 *
 * Oryginał generuje je w Web Workerze przez opentype.js z fontu
 * "Great Rebellion.ttf": każdy znak → osobny <path>, a GSAP animuje
 * stroke-dashoffset (efekt pisania) i dopiero potem wypełnia literę kolorem.
 * Poniżej ten sam algorytm — łącznie z liczeniem viewBox 1:1 z workera.
 */
(function () {
  'use strict';

  var FONT_URL = (window.DATA && window.DATA.handwriteFont) || 'fonts/GreatRebellion.ttf';
  var FONT_SIZE = 100;
  var STROKE_WIDTH = 2;

  var fontPromise = null;
  var cache = new Map();

  function loadFont() {
    if (!fontPromise) {
      fontPromise = fetch(FONT_URL)
        .then(function (r) {
          if (!r.ok) throw new Error('font ' + r.status);
          return r.arrayBuffer();
        })
        .then(function (buf) { return opentype.parse(buf); });
    }
    return fontPromise;
  }

  /* dokładny odpowiednik workera 328 z oryginalnego bundla */
  function buildPaths(font, text, fontSize, letterSpacing, strokeWidth) {
    var chars = text.split('');
    var paths = [];
    var x = 0;
    var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;

    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      var p = font.getPath(ch, x, fontSize, fontSize);
      paths.push(p.toPathData(2));
      var bb = p.getBoundingBox();
      if (isFinite(bb.x1)) {
        x1 = Math.min(x1, bb.x1); y1 = Math.min(y1, bb.y1);
        x2 = Math.max(x2, bb.x2); y2 = Math.max(y2, bb.y2);
      }
      x += font.getAdvanceWidth(ch, fontSize) + fontSize * letterSpacing;
    }

    var half = strokeWidth / 2;
    var viewBox = (x1 - half) + ' ' + (y1 - half) + ' ' +
                  (x2 - x1 + strokeWidth) + ' ' + (y2 - y1 + strokeWidth);
    return { paths: paths, viewBox: viewBox };
  }

  function getPaths(font, text, letterSpacing) {
    var key = FONT_SIZE + '::' + STROKE_WIDTH + '::' + letterSpacing + '::' + text;
    if (!cache.has(key)) cache.set(key, buildPaths(font, text, FONT_SIZE, letterSpacing, STROKE_WIDTH));
    return cache.get(key);
  }

  /**
   * Zamienia kontener [data-handwrite] w rysowane SVG.
   * Zwraca obiekt z metodą play(isHover).
   */
  function initHandwrite(host) {
    var text = host.getAttribute('data-handwrite') || '';
    var color = host.getAttribute('data-color') || '#578bfc';
    var letterSpacing = parseFloat(host.getAttribute('data-letter-spacing') || '0');
    var api = { playing: false, svg: null, tl: null };

    loadFont().then(function (font) {
      var data = getPaths(font, text, letterSpacing);
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'handwrite-overlay_draw__T8P4e');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '200%');
      svg.setAttribute('viewBox', data.viewBox);
      svg.setAttribute('fill', 'none');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      data.paths.forEach(function (d) {
        var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', d);
        p.setAttribute('stroke', color);
        p.setAttribute('stroke-width', String(STROKE_WIDTH));
        p.setAttribute('fill', 'none');
        svg.appendChild(p);
      });

      host.insertBefore(svg, host.firstChild);
      api.svg = svg;
    }).catch(function (e) { console.warn('handwrite:', e.message); });

    /* uruchamia „pisanie”: najpierw kontur, potem wypełnienie */
    api.play = function () {
      if (!api.svg || api.playing) return;
      api.playing = true;

      var paths = api.svg.querySelectorAll('path');
      paths.forEach(function (p) {
        var len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, fill: 'none' });
      });

      var total = text.length * 0.3;
      var per = total / paths.length;
      var tl = gsap.timeline();
      paths.forEach(function (p, i) {
        tl.to(p, { strokeDashoffset: 0, duration: per * 1.2, ease: 'power3.inOut' }, i * 0.06);
        tl.to(p, { fill: color, duration: per * 1.4, ease: 'power1.inOut' }, i * 0.06 + per * 0.4);
      });
      api.tl = tl;
    };

    api.reset = function () {
      if (api.tl) { api.tl.kill(); api.tl = null; }
      api.playing = false;
      if (api.svg) {
        api.svg.querySelectorAll('path').forEach(function (p) {
          var len = p.getTotalLength();
          gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, fill: 'none' });
        });
      }
    };

    host.__handwrite__ = api;
    return api;
  }

  window.initHandwrite = initHandwrite;
  window.loadHandwriteFont = loadFont;
})();
