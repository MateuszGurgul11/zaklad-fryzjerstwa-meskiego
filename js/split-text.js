/*
 * Dzielenie tekstu na słowa/znaki — odpowiednik komponentu SplitText
 * z oryginału (moduł 5516). Zachowana ta sama struktura DOM,
 * bo do niej odwołuje się oryginalny CSS:
 *   <span class="split-text_word__WWxp2 word">
 *     <span class="split-text_char__NoMCx char char2">słowo</span>
 *   </span>
 */
(function () {
  'use strict';

  var LF = String.fromCharCode(10);
  var CR = String.fromCharCode(13);
  var CRLF = CR + LF;
  var NBSP = String.fromCharCode(160);
  var WORD_SPLIT = /(\r\n|\n|\r| |-|‐|–|\/|\\|\|)/;

  function makeWord(text) {
    var w = document.createElement('span');
    w.className = 'split-text_word__WWxp2 word';
    var c = document.createElement('span');
    c.className = 'split-text_char__NoMCx char char2';
    c.textContent = text;
    w.appendChild(c);
    return w;
  }

  /*
   * Zwraca DocumentFragment ze słowami rozdzielonymi spacjami.
   * Wiodące i końcowe spacje są zachowywane, żeby tekst nie sklejał się
   * z sąsiadującymi elementami (np. <strong><a>…</a></strong>).
   */
  function splitToWords(text) {
    var frag = document.createDocumentFragment();
    var src = text.normalize();
    var lead = /^\s/.test(src);
    var trail = /\s$/.test(src);

    var out = [];
    src.split(WORD_SPLIT).forEach(function (p) {
      if (p == null || p === '') return;
      if (p === ' ' || p === NBSP) return;
      out.push(p);
    });
    if (!out.length) return frag;

    if (lead) frag.appendChild(document.createTextNode(' '));
    out.forEach(function (p, i) {
      if (p === LF || p === CR || p === CRLF) {
        frag.appendChild(document.createElement('br'));
        return;
      }
      if (i > 0) frag.appendChild(document.createTextNode(' '));
      frag.appendChild(makeWord(p));
    });
    if (trail) frag.appendChild(document.createTextNode(' '));
    return frag;
  }

  /* rozbija zawartość elementu w miejscu, zachowując zagnieżdżone <a>/<strong> */
  function splitElement(el) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        if (!n.textContent.trim()) return;
        n.parentNode.replaceChild(splitToWords(n.textContent), n);
      } else if (n.nodeType === 1) {
        splitElement(n);
      }
    });
    return el;
  }

  window.splitToWords = splitToWords;
  window.splitElement = splitElement;
})();
