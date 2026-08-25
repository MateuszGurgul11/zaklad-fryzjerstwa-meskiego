/**
 * Elfsight free widget: badge ma display:!important w inline style —
 * CSS go nie przebije, więc usuwamy węzły po wstrzyknięciu.
 */
(function () {
  'use strict';

  var roots = document.querySelectorAll('.ig-feed, .fb-feed, .social-feed');
  if (!roots.length) return;

  function scrub(scope) {
    var box = scope || document;
    if (!box || !box.querySelectorAll) return;
    box.querySelectorAll(
      'a[href*="elfsight.com/instagram-feed"],' +
      'a[href*="elfsight.com/facebook-feed"],' +
      'a[href*="utm_campaign=free-widget"]'
    ).forEach(function (a) {
      a.remove();
    });
    box.querySelectorAll(
      '.eapps-instagram-feed-title-container,' +
      '.eapps-instagram-feed-title,' +
      '.eapps-widget-title,' +
      '.eui-widget-title'
    ).forEach(function (el) {
      /* nie ruszaj nagłówków sekcji strony — tylko wewnątrz widgetów Elfsight */
      if (el.closest('.ig-feed, .fb-feed, .social-feed, [class*="elfsight-app-"]')) {
        el.remove();
      }
    });
  }

  roots.forEach(function (root) { scrub(root); });
  scrub(document);

  var obs = new MutationObserver(function () {
    roots.forEach(function (root) { scrub(root); });
    scrub(document);
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();
