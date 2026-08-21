/*
 * Efekt "gooey" — sygnaturowa animacja oryginału.
 *
 * Zasada działania (1:1 z bundlem, moduł 4705):
 * obok elementu wstrzykiwany jest <svg> z filtrem
 *   feGaussianBlur(stdDeviation) -> feColorMatrix(alpha gain + offset)
 * Rozmycie + wzmocnienie kanału alfa powoduje, że litery przy pojawianiu się
 * najpierw "zlewają się" w kleiste plamy, a potem twardnieją w ostry tekst.
 *
 * Sterowanie odbywa się przez spauzowaną oś czasu GSAP zapisaną w
 * element.__gsapGooeyAnimation__ — dokładnie tak jak w oryginale.
 */
(function () {
  'use strict';

  var FRAME = 1000 / 30;                    // throttling zapisu atrybutów filtra
  var BLUR_RE = /blur\(([\d.]+)(em|px)\)/;
  var uid = 0;

  function round(v, p) { var m = Math.pow(10, p); return Math.round(v * m) / m; }

  function parseBlur(str) {
    var m = String(str).match(BLUR_RE);
    return m ? { value: Number(m[1]), unit: m[2] } : null;
  }

  /* interpolacja blur() od wartości startowej do 0 wraz z postępem */
  function blurAt(filterStr, progress) {
    if (progress >= 1) return 'blur(0px)';
    var b = parseBlur(filterStr);
    if (!b) return filterStr;
    return 'blur(' + round(b.value * (1 - progress), 3) + b.unit + ')';
  }

  function filterMarkup(filterId, svgId, res) {
    return '<svg id="' + svgId + '" class="svg-filters-blur" ' +
           'style="position: absolute; width: 0; height: 0" aria-hidden="true">' +
           '<defs><filter id="' + filterId + '" filterRes="' + (res || 800) + '">' +
           '<feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur"/>' +
           '<feColorMatrix in="blur" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/>' +
           '</filter></defs></svg>';
  }

  /**
   * Podpina animację gooey do elementu.
   * @param {HTMLElement} el          element, którego DZIECI są animowane
   * @param {number}      blurAmount  maks. stdDeviation (domyślnie 2)
   * @param {number}      alphaGain   maks. wzmocnienie alfy (domyślnie 255)
   * @param {object}      from        stan początkowy dzieci
   * @returns {function}  funkcja sprzątająca
   */
  function attachGooey(el, blurAmount, alphaGain, from) {
    blurAmount = blurAmount == null ? 2 : blurAmount;
    alphaGain = alphaGain == null ? 255 : alphaGain;
    from = from || {};
    var start = {
      opacity: from.opacity == null ? 0 : from.opacity,
      filter: from.filter == null ? 'blur(0.8em)' : from.filter
    };

    var filterId = 'gooey-' + (++uid);
    var svgId = filterId + '-svg';
    if (el.parentElement) el.parentElement.insertAdjacentHTML('beforeend', filterMarkup(filterId, svgId));

    var host = el.parentElement || document;
    var feBlur = host.querySelector('#' + filterId + ' > feGaussianBlur');
    var feMatrix = host.querySelector('#' + filterId + ' > feColorMatrix');

    var filterOn = false, lastB = -1, lastG = -1, lastO = -1, lastT = 0;

    var tl = gsap.timeline({ paused: true });
    tl.to({}, {
      duration: 1,
      ease: 'none',
      onUpdate: function () {
        var p = tl.progress();
        var o = start.opacity + (1 - start.opacity) * p;
        var f = blurAt(start.filter, p);

        if (p <= 0) {
          gsap.set(el.children, { visibility: 'hidden', opacity: start.opacity, filter: start.filter });
        } else {
          gsap.set(el.children, { visibility: 'visible', opacity: o, filter: f });
        }

        // stdDeviation maleje do 0; alfa: gain -> 1, offset -> 0
        var dev = blurAmount * (1 - p);
        var gain = 1 + (alphaGain - 1) * (1 - p);
        var off = -alphaGain / 2 * (1 - p);

        if (off === 0 || p <= 0) {
          if (filterOn) { el.style.filter = 'none'; el.style.willChange = ''; filterOn = false; }
        } else if (!filterOn) {
          el.style.filter = 'url(#' + filterId + ')';
          el.style.willChange = 'filter';
          filterOn = true;
        }

        var now = performance.now();
        if (now - lastT < FRAME) return;

        var b = round(dev, 2), g = round(gain, 2), of = round(off, 2);
        if (b !== lastB || g !== lastG || of !== lastO) {
          lastB = b; lastG = g; lastO = of; lastT = now;
          if (feBlur) feBlur.setAttribute('stdDeviation', String(b));
          if (feMatrix) feMatrix.setAttribute('values', '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ' + g + ' ' + of);
        }
      }
    });

    el.__gsapGooeyAnimation__ = tl;
    el.style.filter = 'none';
    el.style.willChange = '';
    gsap.set(el.children, { visibility: 'hidden', opacity: start.opacity, filter: start.filter });

    return function destroy() {
      tl.kill();
      var svg = el.parentElement && el.parentElement.querySelector('#' + svgId);
      if (svg) svg.remove();
      delete el.__gsapGooeyAnimation__;
    };
  }

  /**
   * Wariant liniowy (oryginał: eksport `B` z modułu 4705).
   * Filtr nakładany jest na SŁOWA jednej linii, a animowane są ZNAKI —
   * dzięki temu tekst „wytapia się” linia po linii, a nie całym blokiem.
   * @param {HTMLElement[]} words słowa jednej linii
   * @param {HTMLElement[]} chars znaki tych słów
   */
  function attachGooeyLine(words, chars, blurAmount, alphaGain, from) {
    if (!words.length) return null;
    blurAmount = blurAmount == null ? 2 : blurAmount;
    alphaGain = alphaGain == null ? 255 : alphaGain;
    from = from || {};
    var start = {
      opacity: from.opacity == null ? 0 : from.opacity,
      filter: from.filter == null ? 'blur(0.8em)' : from.filter
    };

    var anchor = words[0];
    var filterId = 'gooey-line-' + (++uid);
    var svgId = filterId + '-svg';
    if (anchor.parentElement) anchor.parentElement.insertAdjacentHTML('beforeend', filterMarkup(filterId, svgId));

    var host = anchor.parentElement || document;
    var feBlur = host.querySelector('#' + filterId + ' > feGaussianBlur');
    var feMatrix = host.querySelector('#' + filterId + ' > feColorMatrix');

    var filterOn = false, lastB = -1, lastG = -1, lastO = -1, lastT = 0;

    var tl = gsap.timeline({ paused: true });
    tl.to({}, {
      duration: 1, ease: 'none',
      onUpdate: function () {
        var p = tl.progress();
        var o = start.opacity + (1 - start.opacity) * p;
        var f = blurAt(start.filter, p);

        if (p <= 0) gsap.set(chars, { visibility: 'hidden', opacity: start.opacity, filter: start.filter });
        else gsap.set(chars, { visibility: 'visible', opacity: o, filter: f });

        var dev = blurAmount * (1 - p);
        var gain = 1 + (alphaGain - 1) * (1 - p);
        var off = -alphaGain / 2 * (1 - p);

        if (off === 0 || p <= 0) {
          if (filterOn) { gsap.set(words, { filter: 'none', willChange: '' }); filterOn = false; }
        } else if (!filterOn) {
          gsap.set(words, { filter: 'url(#' + filterId + ')', willChange: 'filter' });
          filterOn = true;
        }

        var now = performance.now();
        if (now - lastT < FRAME) return;
        var b = round(dev, 2), g = round(gain, 2), of = round(off, 2);
        if (b !== lastB || g !== lastG || of !== lastO) {
          lastB = b; lastG = g; lastO = of; lastT = now;
          if (feBlur) feBlur.setAttribute('stdDeviation', String(b));
          if (feMatrix) feMatrix.setAttribute('values', '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ' + g + ' ' + of);
        }
      }
    });

    gsap.set(words, { filter: 'none', willChange: '' });
    gsap.set(chars, { visibility: 'hidden', opacity: start.opacity, filter: start.filter });

    return {
      timeline: tl,
      destroy: function () {
        tl.kill();
        var svg = host.querySelector('#' + svgId);
        if (svg) svg.remove();
      }
    };
  }

  window.attachGooey = attachGooey;
  window.attachGooeyLine = attachGooeyLine;
})();
