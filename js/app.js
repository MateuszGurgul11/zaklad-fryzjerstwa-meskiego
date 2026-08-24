/*
 * Runtime strony — wspólny dla strony głównej i podstron.
 *
 * Każdy moduł sam sprawdza, czy jego elementy są na stronie, więc ten sam
 * plik obsługuje wszystkie widoki. Stałe czasowe, easingi i progi
 * ScrollTriggera pochodzą z szablonu (patrz _Szablon/README.md).
 */
(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger, CustomEase, Observer, ScrollToPlugin);

  CustomEase.create('quartIn', '0.5, 0, 0.75, 0');
  CustomEase.create('hoverEase', '0.33, 1, 0.68, 1');
  CustomEase.create('openFullScreen', '0.7, -0.23, 0.17, 1');
  CustomEase.create('closeFullScreen', '0.22, 1, 0.36, 1');

  gsap.defaults({ ease: 'none', duration: 1 });
  gsap.config({ autoSleep: 60, nullTargetWarn: false });
  gsap.ticker.lagSmoothing(0);

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var D = window.DATA;

  var scroller = $('#scroll');
  var content = $('.scroll_content__SD1RT');
  var lenis;

  /* ------------------------------------------------------------------ *
   *  Podstawy
   * ------------------------------------------------------------------ */
  function device() {
    var w = window.innerWidth;
    if (w <= 480) return 'mobile';
    if (w <= 1024) return 'tablet';
    return 'desktop';
  }
  function isDesktop() { return window.innerWidth > 1024; }
  function windowSize() { return D.windowSizes[device()](); }
  function setVar(el, n, v) { if (el) el.style.setProperty(n, v); }

  function updateScrollbarVar() {
    var w = scroller ? scroller.offsetWidth - scroller.clientWidth : 0;
    document.documentElement.style.setProperty('--scrollbar-width', w + 'px');
  }

  function scrollY() {
    return lenis ? lenis.scroll : (scroller.scrollTop || 0);
  }

  function resetScroll() {
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    if (scroller) scroller.scrollTop = 0;
    if (window.scrollTo) window.scrollTo(0, 0);
  }

  function initScroll() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    resetScroll();

    lenis = new Lenis({ wrapper: scroller, content: content, lerp: 0.1, smoothWheel: true, autoRaf: false });
    window.__GLOBAL_SCROLL = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });

    ScrollTrigger.scrollerProxy(scroller, {
      scrollTop: function (v) {
        if (arguments.length) {
          if (lenis) lenis.scrollTo(v, { immediate: true, force: true });
          else scroller.scrollTop = v;
        }
        return scrollY();
      },
      getBoundingClientRect: function () {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
      scrollHeight: function () { return content ? content.scrollHeight : scroller.scrollHeight; }
    });
    ScrollTrigger.defaults({ scroller: scroller });
    ScrollTrigger.addEventListener('refresh', function () { if (lenis) lenis.resize(); });
    ScrollTrigger.clearScrollMemory('manual');
    lenis.stop();
    if (scroller) scroller.style.overflow = 'hidden';
  }

  /* przewijanie do kotwic w obrębie strony */
  function bindAnchor(a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) !== '#' || href === '#') return;
      var target = $(href);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.4 });
    });
  }

  /* ------------------------------------------------------------------ *
   *  Pismo odręczne / gooey
   * ------------------------------------------------------------------ */
  function initHandwrites(root) {
    $$('[data-handwrite]', root || document).forEach(function (el) {
      if (!el.__handwrite__) initHandwrite(el);
    });
  }

  function showHandwrite(host, on) {
    if (!host) return;
    host.classList.toggle('handwrite-overlay_hover__cdHOt', !!on);
    var api = host.__handwrite__;
    if (api) {
      if (on) api.play(); else api.reset();
    }
    if (on) {
      requestAnimationFrame(function () {
        fitHandwriteOnScreen(host);
        requestAnimationFrame(function () { fitHandwriteOnScreen(host); });
      });
    } else {
      var btn = host.closest('.animated-button_root__TXo7Y');
      if (btn) btn.style.setProperty('--shift', '0px');
    }
  }

  /* graffiti jest centrowane na przycisku — długie nazwy wychodzą poza lewą krawędź */
  function fitHandwriteOnScreen(host) {
    var btn = host && host.closest('.animated-button_root__TXo7Y');
    if (!btn) return;
    btn.style.setProperty('--shift', '0px');
    var el = host.querySelector('.handwrite-overlay_draw__T8P4e') || host;
    var pad = Math.max(20, window.innerWidth * 0.03);
    var r = el.getBoundingClientRect();
    var vw = window.innerWidth;
    var shift = 0;
    if (r.left < pad) shift += pad - r.left;
    if (r.right + shift > vw - pad) shift -= (r.right + shift) - (vw - pad);
    if (r.left + shift < pad) shift = pad - r.left;
    btn.style.setProperty('--shift', Math.round(shift) + 'px');
  }

  function initGooeyButton(bodyWrap, opts) {
    opts = opts || {};
    attachGooey(bodyWrap, 2, 255, opts.from);
    bodyWrap.__gsapGooeyAnimation__.progress(opts.initial == null ? 1 : opts.initial);
    var tw = null;
    bodyWrap.__gooeyTo__ = function (p) {
      if (bodyWrap.__disableGooeyAnimationButton__) return;
      if (tw) tw.kill();
      tw = gsap.to(bodyWrap.__gsapGooeyAnimation__, { progress: p, duration: 0.5, ease: 'hoverEase' });
    };
    return bodyWrap.__gooeyTo__;
  }

  /* grupuje .word po pozycji pionowej → linie tekstu */
  function groupLines(root) {
    var words = $$('.word:not(.word .word)', root);
    var map = new Map();
    var top0 = root.getBoundingClientRect().top;
    words.forEach(function (w) {
      var top = Math.round(w.getBoundingClientRect().top - top0);
      if (!map.has(top)) map.set(top, []);
      map.get(top).push(w);
    });
    return Array.from(map.keys()).sort(function (a, b) { return a - b; }).map(function (k) {
      var ws = map.get(k), chars = [];
      ws.forEach(function (w) { chars = chars.concat($$('.char:not(.char .char)', w)); });
      return { words: ws, chars: chars };
    });
  }

  /* wyłanianie tekstu linia po linii, sterowane scrollem */
  function bindLines(root, start, end, blur) {
    groupLines(root).forEach(function (l) {
      var g = attachGooeyLine(l.words, l.chars, 2, 255, { opacity: 0, filter: blur || 'blur(0.8em)' });
      if (!g) return;
      gsap.fromTo(g.timeline, { progress: 0 }, {
        progress: 1, duration: 1, ease: 'none', overwrite: true,
        scrollTrigger: { trigger: l.words[0], start: start, end: end, scrub: true, invalidateOnRefresh: true }
      });
    });
  }

  /* proste wyłanianie bloku (karty zespołu, opinie, wiersze cennika) */
  function revealOnScroll(els, opts) {
    opts = opts || {};
    els.forEach(function (el, i) {
      gsap.fromTo(el,
        { opacity: 0, y: opts.y == null ? 28 : opts.y, filter: 'blur(0.4em)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: opts.duration || 0.9, ease: 'power3.out',
          delay: (i % (opts.perRow || 3)) * 0.08,
          scrollTrigger: { trigger: el, start: opts.start || 'top 88%', invalidateOnRefresh: true }
        });
    });
  }

  /* ------------------------------------------------------------------ *
   *  PRELOADER
   * ------------------------------------------------------------------ */
  function runPreloader(done) {
    var root = $('.preloader_root__KN4wH');
    if (!root) {
      if (scroller) scroller.style.overflow = '';
      resetScroll();
      if (lenis) lenis.start();
      done();
      return;
    }

    var contentEl = $('.preloader_content__OcKjQ', root);
    var value = $('.preloader_value__bLGU1', root);
    var counter = { v: 0 };
    var tl = gsap.timeline();

    tl.to(contentEl, { opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' });
    tl.to(counter, {
      v: 100, duration: 1.8, ease: 'power2.inOut',
      onUpdate: function () {
        var n = Math.round(counter.v);
        value.textContent = n < 10 ? '0' + n : String(n);
      }
    }, 0.2);
    tl.to(contentEl, { opacity: 0, filter: 'blur(34px)', duration: 0.5, ease: 'power3.in' });
    tl.to(root, {
      opacity: 0, duration: 0.6, ease: 'power2.inOut',
      onComplete: function () {
        root.style.display = 'none';
        if (scroller) scroller.style.overflow = '';
        resetScroll();
        if (lenis) lenis.start();
        done();
      }
    }, '-=0.1');
  }

  /* ------------------------------------------------------------------ *
   *  NAGŁÓWEK
   * ------------------------------------------------------------------ */
  function initHeader() {
    var header = $('[data-nav]');
    if (!header) return;

    var logoWrapper = $('[data-logo]');
    var links = $$('.nav__link', header);

    if (logoWrapper) {
      fetch('svg/header-logo.svg').then(function (r) { return r.text(); }).then(function (svg) {
        logoWrapper.innerHTML = svg;
      }).catch(function () {});
    }

    /* każdy odnośnik ma własną nakładkę z pismem odręcznym */
    links.forEach(function (a) {
      var hw = $('[data-handwrite]', a);
      a.addEventListener('pointerenter', function () { showHandwrite(hw, true); });
      a.addEventListener('pointerleave', function () { showHandwrite(hw, false); });
      bindAnchor(a);
    });

    gsap.fromTo(header, { opacity: 0, y: -12 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' });

    /* przyciemniona szybka po odjechaniu od góry — bez niej tekst gubi się
       na jaśniejszych kadrach tła */
    function syncScrolled() {
      header.classList.toggle('is-scrolled', (scroller.scrollTop || 0) > 24);
    }
    syncScrolled();
    scroller.addEventListener('scroll', syncScrolled, { passive: true });

    initBurger(header);
  }

  /* ------------------------------------------------------------------ *
   *  MENU MOBILNE
   * ------------------------------------------------------------------ */
  function initBurger(header) {
    var burger = $('[data-burger]', header);
    var menu = $('[data-menu]');
    if (!burger || !menu) return;

    function setOpen(open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      if (lenis) open ? lenis.stop() : lenis.start();
    }

    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });

    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });

    // po powiększeniu okna panel nie ma prawa zostać otwarty
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------ *
   *  HERO
   * ------------------------------------------------------------------ */
  function prepareHero() {
    var mark = $('.hero-section_mark__img');
    if (mark) {
      gsap.set(mark, { opacity: 0, filter: 'blur(0.3em)' });
    }
  }

  function initHero() {
    var hero = $('.hero-section_root__ZsTA_');
    if (!hero) return;

    var mark = $('.hero-section_mark__img', hero);
    var textBlock = $('.hero-section_text__GA552', hero);
    var scrollWord = $('[data-scroll-word]', hero);

    if (scrollWord) scrollWord.textContent = isDesktop() ? 'przewiń' : 'przesuń';

    if (mark) {
      gsap.fromTo(mark, { opacity: 0, filter: 'blur(0.3em)' },
        { opacity: 1, filter: 'blur(0px)', ease: 'power3.out', duration: 1.6, delay: 0.15 });
    }
    if (textBlock) {
      var p = $('p[data-split]', textBlock);
      if (p) splitElement(p);
      textBlock.classList.remove('hero-section_hiddenText__LBjYV');
      groupLines(textBlock).map(function (l) {
        return attachGooeyLine(l.words, l.chars, 2, 255, { opacity: 0, filter: 'blur(0.3em)' });
      }).filter(Boolean).forEach(function (a, i) {
        gsap.to(a.timeline, { progress: 1, duration: 0.9, ease: 'power2.inOut', delay: 0.6 + i * 0.05 });
      });
    }
  }

  /* ------------------------------------------------------------------ *
   *  OKNO SEKCJI (clip-path rect)
   * ------------------------------------------------------------------ */
  function initWindow(el, opts) {
    if (!el) return;
    var inner = opts.inner, lateInner = opts.lateInner, withOuter = opts.withOuter;
    var px = function (v) { return v + 'px'; };

    var originalY = 0;
    function measure() {
      originalY = el.getBoundingClientRect().top + (scroller.scrollTop || 0);
      onScroll();
    }
    function onScroll() {
      setVar(el, '--top-bound', Math.max((scroller.scrollTop || 0) - originalY, 0) + 'px');
    }
    measure();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    ScrollTrigger.addEventListener('refresh', measure);

    var size = windowSize();

    function introStart() {
      if (!lateInner) return 'top top';
      var n = windowSize().n;
      return 'top top+=' + ((window.innerHeight - window.innerHeight * (n / 100)) / 2);
    }
    function introEnd() { return '+=' + window.innerHeight; }

    function runScrub() {
      gsap.fromTo(el,
        {
          '--width': function () { return px(windowSize().width); },
          '--height': function () { return px(windowSize().height); },
          '--border-radius': function () { return px(windowSize().borderRadius); }
        },
        {
          '--width': function () { return px(D.expanded.width()); },
          '--height': function () { return px(D.expanded.height()); },
          '--border-radius': '0px',
          ease: 'none',
          scrollTrigger: {
            trigger: el, start: introStart, end: introEnd, scrub: true, invalidateOnRefresh: true,
            onLeave: function () { if (opts.onVisible) opts.onVisible(true); },
            onEnterBack: function () { if (opts.onVisible) opts.onVisible(false); },
            onRefresh: function (self) {
              if (scrollY() < 8) {
                self.scroll(0);
                self.animation.progress(0);
                setCollapsed();
              }
            },
            onUpdate: function (self) {
              el.classList.toggle('window-section-wrapper_clipOff__T_DsC', self.progress >= D.epsilon.end);
            }
          }
        });

      if (withOuter) {
        gsap.fromTo(el,
          {
            '--width': function () { return px(D.expanded.width()); },
            '--height': function () { return px(D.expanded.height()); },
            '--border-radius': '0px'
          },
          {
            '--width': '0px', '--height': '0px',
            '--border-radius': function () { return px(windowSize().borderRadius); },
            ease: 'none', immediateRender: false,
            scrollTrigger: {
              trigger: el,
              start: function () { return 'bottom-=' + window.innerHeight + ' bottom'; },
              end: 'bottom bottom', scrub: true, invalidateOnRefresh: true,
              onEnter: function () { if (opts.onVisible) opts.onVisible(false); },
              onLeaveBack: function () { if (opts.onVisible) opts.onVisible(true); },
              onUpdate: function (self) {
                el.classList.toggle('window-section-wrapper_clipOff__T_DsC', self.progress <= D.epsilon.begin);
              }
            }
          });
      }
    }

    function setCollapsed() {
      var s = windowSize();
      gsap.set(el, { '--width': px(s.width), '--height': px(s.height), '--border-radius': px(s.borderRadius) });
    }

    if (inner) {
      gsap.set(el, { '--width': '0px', '--height': '0px', '--border-radius': '64px' });
      var intro = gsap.to(el, {
        '--width': px(size.width), '--height': px(size.height), '--border-radius': px(size.borderRadius),
        duration: 1, delay: 0.8, ease: 'power3.out',
        onComplete: function () {
          runScrub();
          if (scrollY() < 8) {
            resetScroll();
            setCollapsed();
          }
        }
      });
      ScrollTrigger.create({
        trigger: el, start: introStart, end: introEnd,
        onEnter: function (self) {
          if (scrollY() < 24) return;
          if (intro && intro.isActive()) { intro.kill(); setCollapsed(); runScrub(); }
        }
      });
    } else {
      setCollapsed();
      runScrub();
    }
    el.style.visibility = 'visible';
  }

  /* ------------------------------------------------------------------ *
   *  SEKCJA USŁUG (strona główna) — lista nazw + ceny, tło bad-TV
   * ------------------------------------------------------------------ */
  function initServices() {
    var root = $('.projects-section_root__aoLKL');
    if (!root) return null;

    var list = $('[data-services-list]', root);
    var badtvHost = $('[data-badtv]', root);
    var scrollBtn = $('[data-scroll-btn]', root);

    /* krótkie etykiety — pełne nazwy z Booksy nie mieszczą się w oknie */
    var wszystkie = D.wszystkieUslugi();
    var items = [
      { tytul: 'Fade', hw: '90 zł', href: 'uslugi.html' },
      { tytul: 'Combo krótkie', hw: '130 zł', href: 'uslugi.html' },
      { tytul: 'Tylko boki', hw: '70 zł', href: 'uslugi.html' },
      { tytul: 'Combo długie', hw: '160 zł', href: 'uslugi.html' },
      { tytul: 'Broda', hw: '70 zł', href: 'uslugi.html' },
      { tytul: 'Tata i syn', hw: '140 zł', href: 'uslugi.html' },
      { tytul: 'Cały cennik', hw: String(wszystkie.length), href: 'uslugi.html' }
    ];

    var buttons = items.map(function (it, idx) {
      var li = document.createElement('li');
      li.innerHTML =
        '<a class="button_root__xL6bS styled-button_root__sDnJI styled-button_variant-project__d69KU ' +
        'animated-button_root__TXo7Y animated-button_variant-project__8pJgf projects-section_projectButton__ET6Jm" ' +
        'href="' + it.href + '" style="--shift:0px">' +
          '<span class="styled-button_bodyWrap__un4I_ button-body" data-gooey>' +
            '<span class="styled-button_body__YQ59t"><span><span class="btn-text">' + it.tytul + '</span></span></span>' +
          '</span>' +
          '<div class="handwrite-overlay_root__oa9z7 animated-button_handeWrite__h8Bmg hande-write" ' +
               'style="color:' + D.akcent + '" data-handwrite="' + it.tytul + '" data-color="' + D.akcent + '">' +
            '<span class="handwrite-overlay_hiddenText__vgaeM">' + it.tytul + '</span>' +
          '</div>' +
        '</a>';
      list.appendChild(li);
      var a = li.querySelector('a');
      var body = $('[data-gooey]', a);
      initGooeyButton(body, { initial: 0 });
      initHandwrite($('[data-handwrite]', a));
      a.addEventListener('mouseenter', function () { if (isDesktop()) setActive(idx); });
      return { a: a, body: body, hw: $('[data-handwrite]', a), li: li };
    });

    var activeIndex = -1, listVisible = false;
    var heroTlo = D.heroTlo || [];
    var badtv = createBadTV(badtvHost, heroTlo.map(function (g) { return g.src; }));

    function setActive(i) {
      var same = i === activeIndex;
      activeIndex = i;
      buttons.forEach(function (b, k) {
        b.a.classList.toggle('projects-section_activeBtn__fTE3m', k === i);
        b.a.classList.toggle('styled-button_active__07_My', k === i);
        showHandwrite(b.hw, k === i && listVisible);
        gsap.to(b.body, {
          filter: (k === i && listVisible) ? 'blur(0.18em)' : 'blur(0px)',
          duration: 0.25, ease: 'hoverEase', overwrite: true
        });
      });
      if (!same && heroTlo.length) badtv.setActive(i % heroTlo.length);
    }

    if (!isDesktop()) {
      buttons.forEach(function (b, i) {
        ScrollTrigger.create({
          trigger: b.li,
          start: function () { return 'top+=' + offsetFor(b.li) + ' center'; },
          end: function () { return 'bottom+=' + offsetFor(b.li) + ' center'; },
          invalidateOnRefresh: true,
          onEnter: function () { setActive(i); },
          onEnterBack: function () { setActive(i); }
        });
      });
    } else {
      /* desktop: lista stoi w miejscu — scroll w „oknie" przełącza pozycje, potem idzie do „o nas" */
      var win = root.closest('[data-window="services"]') || root;
      ScrollTrigger.create({
        trigger: win,
        start: function () { return 'top top+=' + window.innerHeight; },
        end: function () { return 'bottom bottom-=' + window.innerHeight; },
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          if (!listVisible) return;
          var n = buttons.length;
          if (!n) return;
          var i = Math.min(n - 1, Math.floor(self.progress * n * 0.999));
          setActive(i);
        }
      });
    }
    function offsetFor(el) { return (1.2 * window.innerHeight - 0.5 * (el.offsetHeight || 0)) + 'px'; }

    function syncListVars() {
      setVar(root, '--list-height', '0px');
      setVar(root, '--margin-bottom', '0px');
      if (isDesktop()) return;
      var lh = list.offsetHeight, rh = root.offsetHeight || 0;
      setVar(root, '--list-height', lh + 'px');
      setVar(root, '--margin-bottom', Math.max(0, rh - lh) + 'px');
    }
    syncListVars();
    window.addEventListener('resize', syncListVars);

    function reveal(on) {
      listVisible = on;
      list.classList.toggle('projects-section_visible__JchWB', on);
      if (on) setActive(activeIndex < 0 ? 0 : activeIndex);
      buttons.forEach(function (b, i) {
        gsap.killTweensOf(b.body.__gsapGooeyAnimation__);
        b.body.__disableGooeyAnimationButton__ = true;
        gsap.to(b.body.__gsapGooeyAnimation__, {
          progress: on ? 1 : 0, duration: 0.4, ease: 'hoverEase', overwrite: true, delay: on ? i * 0.03 : 0,
          onComplete: function () {
            b.body.__disableGooeyAnimationButton__ = false;
            if (on && i === activeIndex) {
              gsap.to(b.body, { filter: 'blur(0.18em)', duration: 0.25, ease: 'hoverEase', overwrite: true });
            } else if (!on) {
              gsap.set(b.body, { filter: 'blur(0px)' });
            }
          }
        });
      });
      badtv.setPlaying(on);
    }

    if (scrollBtn) {
      scrollBtn.addEventListener('click', function () {
        if (lenis) lenis.scrollTo(2 * window.innerHeight, {
          duration: 1.2, easing: function (x) { var t = x - 1; return t * t * t + 1; }
        });
      });
      scroller.addEventListener('scroll', function () {
        scrollBtn.classList.toggle('projects-section_enableScrollButton__losoq',
          scroller.scrollTop < window.innerHeight);
      }, { passive: true });
    }

    return { reveal: reveal };
  }

  /* ------------------------------------------------------------------ *
   *  SNAP NA SEKCJI USŁUG
   *  Lenis steruje scrollem, więc CSS scroll-snap jest ignorowany.
   *  Przechwytujemy gest w dół, który minąłby moment pełnego otwarcia
   *  okna (koniec intro = 1× viewport) — wtedy lista jest już widoczna.
   * ------------------------------------------------------------------ */
  function initServicesSnap(win) {
    if (!win || !lenis) return;

    var snapping = false;
    var lockUntil = 0;
    var armed = true;

    function easeOutCubic(x) {
      var t = x - 1;
      return t * t * t + 1;
    }

    function snapY() {
      return Math.round(win.getBoundingClientRect().top + scrollY() + window.innerHeight);
    }

    function go(y) {
      snapping = true;
      lockUntil = Date.now() + 480;
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var dist = Math.abs(y - scrollY());
      var duration = reduce ? 0 : Math.max(0.35, Math.min(0.95, 0.25 + dist / 2200));
      lenis.scrollTo(y, {
        duration: duration,
        lock: true,
        force: true,
        easing: easeOutCubic,
        onComplete: function () {
          snapping = false;
          lockUntil = Date.now() + 280;
        }
      });
    }

    function consume(data) {
      if (data.event && data.event.cancelable) data.event.preventDefault();
      data.event.lenisStopPropagation = true;
    }

    lenis.on('virtual-scroll', function (data) {
      var now = Date.now();
      if (snapping || now < lockUntil) {
        consume(data);
        return;
      }

      var dy = data.deltaY;
      if (!dy) return;

      var snap = snapY();
      var current = lenis.animatedScroll;
      var projected = lenis.targetScroll + dy;
      var hyst = window.innerHeight * 0.3;

      if (current < snap - hyst) armed = true;

      if (dy > 0 && armed && current < snap && projected > snap) {
        consume(data);
        armed = false;
        go(snap);
      }
    });
  }

  /* ------------------------------------------------------------------ *
   *  SEKCJA „O NAS" — tekst z akcentami
   * ------------------------------------------------------------------ */
  function initAbout() {
    var h2 = $('[data-about-title]');
    var desc = $('.about-section_description__S5CUq');
    if (!h2 && !desc) return;

    if (h2 && h2.hasAttribute('data-about-title')) {
      (JSON.parse(h2.getAttribute('data-about-title') || '[]')).forEach(function (part) {
        if (part.text) {
          h2.appendChild(splitToWords(part.text));
          h2.appendChild(document.createTextNode(' '));
          return;
        }
        var wrap = document.createElement('span');
        wrap.className = 'about-section_itemWrapper__DjMD3';
        wrap.innerHTML =
          '<a class="button_root__xL6bS styled-button_root__sDnJI styled-button_variant-about__Qo12W ' +
          'animated-button_root__TXo7Y animated-button_variant-about___bN_a" href="' + part.link + '" style="--shift:0px">' +
            '<span class="styled-button_bodyWrap__un4I_ button-body" data-gooey>' +
              '<span class="styled-button_body__YQ59t"><span><span class="btn-text"></span></span></span>' +
            '</span>' +
            '<div class="handwrite-overlay_root__oa9z7 animated-button_handeWrite__h8Bmg hande-write" ' +
                 'style="color:' + D.akcent + '" data-handwrite="' + part.accent + '" data-color="' + D.akcent + '">' +
              '<span class="handwrite-overlay_hiddenText__vgaeM">' + part.accent + '</span>' +
            '</div>' +
          '</a>';
        $('.btn-text', wrap).appendChild(splitToWords(part.accent));
        h2.appendChild(wrap);
        h2.appendChild(document.createTextNode(' '));

        var a = wrap.querySelector('a');
        var hw = $('[data-handwrite]', a);
        initHandwrite(hw);
        a.addEventListener('pointerenter', function () { showHandwrite(hw, true); });
        a.addEventListener('pointerleave', function () { showHandwrite(hw, false); });
        bindAnchor(a);
      });
    }

    if (desc && desc.hasAttribute('data-split')) {
      desc.textContent = '';
      desc.appendChild(splitToWords(desc.getAttribute('data-split')));
    }

    (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
      requestAnimationFrame(function () {
        if (h2) bindLines(h2, 'top 90%', 'top 55%');
        if (desc) bindLines(desc, 'top 90%', 'top 60%');
        ScrollTrigger.refresh();
      });
    });
  }

  /* ------------------------------------------------------------------ *
   *  ZESPÓŁ / OPINIE / CENNIK / GALERIA — proste wyłanianie
   * ------------------------------------------------------------------ */
  function initReveals() {
    revealOnScroll($$('[data-reveal]'), { perRow: 3 });
    revealOnScroll($$('[data-reveal-row]'), { perRow: 1, y: 18, duration: 0.7 });

    // nagłówki sekcji — gooey jak w oryginale
    $$('[data-gooey-scroll]').forEach(function (el) {
      attachGooey(el, 2, 255, { opacity: 0.75, filter: 'blur(0.3em)' });
      gsap.fromTo(el.__gsapGooeyAnimation__, { progress: 0 }, {
        progress: 1, duration: 1, ease: 'none', overwrite: true,
        scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 55%', scrub: true, invalidateOnRefresh: true }
      });
    });
  }

  /* licznik opinii — „549" nabija się przy wejściu w kadr */
  function initCounters() {
    $$('[data-count-to]').forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-count-to'));
      var dec = parseInt(el.getAttribute('data-count-decimals') || '0', 10);
      var o = { v: 0 };
      gsap.to(o, {
        v: to, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', invalidateOnRefresh: true },
        onUpdate: function () { el.textContent = o.v.toFixed(dec).replace('.', ','); }
      });
    });
  }

  /* ------------------------------------------------------------------ *
   *  KONTAKT
   * ------------------------------------------------------------------ */
  function initContact() {
    var titleWrap = $('.contact-section_title__BU1nF');
    if (titleWrap) {
      attachGooey(titleWrap, 2, 255, { opacity: 0.75, filter: 'blur(0.3em)' });
      gsap.fromTo(titleWrap.__gsapGooeyAnimation__, { progress: 0 }, {
        progress: 1, duration: 1, ease: 'none', overwrite: true,
        scrollTrigger: { trigger: titleWrap, start: 'top 80%', end: 'top 50%', scrub: true, invalidateOnRefresh: true }
      });
    }
    $$('.contact-section_animatedBg__B9g_u img').forEach(function (img, i) {
      gsap.fromTo(img, { opacity: 0, filter: 'blur(34px)' }, {
        opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power2.out', delay: i * 0.08,
        scrollTrigger: { trigger: img, start: 'top 95%', invalidateOnRefresh: true }
      });
    });
  }

  /* dzisiejsze godziny: podpis w stopce + podświetlony wiersz w tabeli */
  function initOpenNow() {
    var idx = (new Date().getDay() + 6) % 7;            // 0 = poniedziałek
    var d = D.godziny[idx];

    $$('[data-open-now]').forEach(function (e) {
      e.textContent = d.od ? ('Dziś ' + d.od + '–' + d.do) : 'Dziś nieczynne';
    });

    $$('.hours tr[data-day="' + idx + '"]').forEach(function (tr) {
      tr.setAttribute('data-today', '');
    });
  }

  /* ------------------------------------------------------------------ *
   *  START
   * ------------------------------------------------------------------ */
  function boot() {
    updateScrollbarVar();
    window.addEventListener('resize', updateScrollbarVar);

    initScroll();
    initHandwrites();
    $$('a[href^="#"]').forEach(bindAnchor);
    prepareHero();

    runPreloader(function () {
      initHeader();
      initHero();

      var services = initServices();
      initAbout();
      initReveals();
      initCounters();
      initContact();
      initOpenNow();

      var winProjects = $('[data-window="services"]');
      var winContact = $('[data-window="contact"]');
      resetScroll();
      if (winProjects) {
        initWindow(winProjects, { inner: true, withOuter: true, onVisible: services && services.reveal });
        initServicesSnap(winProjects);
      }
      if (winContact) initWindow(winContact, { lateInner: true });

      ScrollTrigger.refresh();
      resetScroll();
      window.addEventListener('resize', function () { ScrollTrigger.refresh(); });

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          ScrollTrigger.refresh();
          if (scrollY() < 8) resetScroll();
        });
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
