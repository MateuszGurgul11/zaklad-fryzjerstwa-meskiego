#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Generator statycznych stron.

Składa index.html i podstrony ze wspólnych fragmentów (head, preloader,
nagłówek, stopka) oraz z danych zakładu. Wynikiem są zwykłe pliki HTML —
można je potem edytować ręcznie, ale wtedy kolejne uruchomienie skryptu
je nadpisze.

    python _tools/build.py

Dane pochodzą z DANE poniżej; ten sam komplet jest w js/data.js dla części
renderowanej po stronie przeglądarki (animacje, licznik opinii).
"""
import io
import json
import os
import re
import sys

for s in (sys.stdout, sys.stderr):
    try:
        s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------- dane

FIRMA = {
    "nazwa": "Zakład Fryzjerstwa Męskiego",
    "tagline": "Barbershop • Wilda, Poznań",
    "opis": ("Miejsce, w którym poczujesz się swobodnie, zapomnisz na chwilę "
             "o galopującym świecie. Wyjdziesz od nas naładowany pozytywną "
             "energią oraz ze świetną fryzurą."),
    "podmiot": "BEAUTY I BARBER SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ",
    "ulica": "ul. Mieczysława Niedziałkowskiego 2",
    "kod": "61-578",
    "miasto": "Poznań",
    "dzielnica": "Wilda",
    "telefon": "536 880 760",
    "telefon_href": "tel:+48536880760",
    "lat": 52.39952001,
    "lng": 16.92594,
    "wiek": "Zapraszamy osoby od 16 roku życia.",
    "polityka": "Zmiany w rezerwacji możliwe do 1 godziny przed wizytą.",
}

LINKI = {
    "booksy": "https://booksy.com/pl-pl/129109_zaklad-fryzjerstwa-meskiego_barber-shop_15608_poznan",
    "instagram": "https://www.instagram.com/zaklad_fryzjerstwa_meskiego/",
    "facebook": "https://www.facebook.com/zakladfryzjerstwameskiego/",
    "mapa": "https://www.google.com/maps/search/?api=1&query=52.39952001,16.92594",
}

OPINIE_META = {"ocena": "5,0", "ocena_num": 4.97, "liczba": 549}

GODZINY = [
    ("Poniedziałek", "09:00", "20:00"),
    ("Wtorek", "09:00", "20:00"),
    ("Środa", "09:00", "20:00"),
    ("Czwartek", "09:00", "20:00"),
    ("Piątek", "09:00", "20:00"),
    ("Sobota", "10:00", "17:00"),
    ("Niedziela", None, None),
]

ZESPOL = [
    ("Paula", "Bejbik", "assets/booksy/staff/paula.jpeg"),
    ("Zosia", None, "assets/booksy/staff/zosia.jpeg"),
    ("Łukasz", "Łuki Zyss Zysnarski", "assets/booksy/staff/luki.jpeg"),
]

CENNIK = [
    ("Strzyżenie", "Podstawa. Mycie, cięcie, stylizacja.", [
        ("Strzyżenie maszynką na jedną długość", 50, 30,
         "Strzyżenie jedną nakładką całej głowy lub golenie głowy na zero."),
        ("Tylko boki", 70, 40, "Mycie, strzyżenie samych boków, stylizacja."),
        ("Strzyżenie brody", 70, 45, "Konturowanie i strzyżenie brody, stylizacja."),
        ("Buzz cut", 80, 45, "Precyzyjne strzyżenie maszynką."),
        ("Strzyżenie męskie — fade", 90, 60,
         "Mycie głowy, strzyżenie włosów krótkich, stylizacja. Wszystkie krótkie formy "
         "użytkowe: crop, side part, quiff — z bokami wygolonymi maszynką."),
        ("Strzyżenie włosów średnich i długich", 120, 70,
         "Mycie głowy, strzyżenie, stylizacja. Formy wykonywane głównie nożyczkami."),
    ]),
    ("Combo", "Włosy i broda w jednej wizycie. Z aromaterapią i brzytwą.", [
        ("Combo krótkie włosy", 130, 105,
         "Mycie, modelowanie i dobór produktów do włosów i brody."),
        ("Combo długie włosy", 160, 120,
         "Strzyżenie, mycie głowy, modelowanie, trymerowanie brody, aromaterapia "
         "wapozonem otwierająca pory, podgolenie brzytwą lub shaverem."),
        ("Combo z odsiwianiem brody", 180, 130, "Pełne combo uzupełnione o odsiwianie brody."),
        ("Combo z odsiwianiem — broda i głowa", 230, 140,
         "Pełne combo z odsiwianiem brody i włosów."),
    ]),
    ("Tata i syn", "Wizyta we dwóch. Dla najmłodszych klientów z opiekunem.", [
        ("Strzyżenie dzieci 7–12 lat", 70, 60, None),
        ("Strzyżenie tata i synek do 8 lat", 140, 120, None),
        ("Brodaty tata i syn do 8 lat", 170, 165, None),
    ]),
    ("Łukasz", "Osobna taryfa. Tu również trwała utrzymująca się do 9 tygodni.", [
        ("Strzyżenie brody", 90, 30, None),
        ("Strzyżenie męskie — fade", 100, 40, None),
        ("Strzyżenie średnich i długich włosów", 120, 45, None),
        ("Combo krótkie włosy", 150, 50, None),
        ("Combo długie włosy", 180, 60, None),
        ("Combo krótkie włosy z odsiwianiem brody lub głowy", 200, 70, None),
        ("Trwała do 9 tygodni — tylko góra", 240, 75, None),
        ("Trwała do 9 tygodni — cała głowa", 290, 80, None),
        ("Trwała do 9 tygodni — tylko góra + strzyżenie", 300, 95, None),
        ("Trwała do 9 tygodni — cała głowa + strzyżenie", 350, 115, None),
    ]),
]

CYTATY = [
    ("Pierwsza wizyta u Pauli i to było chyba najlepsze cięcie w życiu. Serio, totalny "
     "powiew świeżości jeśli chodzi o fryzurę i super atmosfera w trakcie. Bardzo mocno polecam!",
     "Mateusz L.", "maj 2026"),
    ("Prze-rewelacyjnie! Z dokładnością „co do włoska”. Mega modnie! Polecam „jak nie wiem”!",
     "Maciej R.", "sierpień 2026"),
    ("Pierwsza wizyta w tym salonie i bardzo pozytywne zaskoczenie podejściem do klienta. "
     "Zosia robi super robotę.", "Patryk T.", "czerwiec 2026"),
    ("Pomimo mojego braku zdecydowania i podenerwowania wszystko zostało zrobione "
     "perfekcyjnie. Polecam serdecznie!", "Krzysztof R.", "czerwiec 2026"),
    ("Wizyta jak zwykle super. Strzyżenie dokładnie tak jak chciałem i za bardzo dobrą stawkę.",
     "Damian B.", "lipiec 2026"),
    ("Bardzo fajnie i miło, polecam miejscówkę, a w szczególności Paulę która mnie dziś strzygła.",
     "Łukasz G.", "czerwiec 2026"),
]

GALERIA = [
    ("assets/booksy/inspiration/praca-01.jpeg", "Efekt pracy — strzyżenie męskie"),
    ("assets/booksy/inspiration/praca-02.jpeg", "Efekt pracy — fade"),
    ("assets/booksy/biz/salon-01.jpeg", "Wnętrze zakładu"),
    ("assets/booksy/inspiration/praca-03.jpeg", "Efekt pracy — broda"),
    ("assets/booksy/inspiration/praca-04.jpeg", "Efekt pracy — combo"),
    ("assets/booksy/biz/salon-02.jpeg", "Stanowisko barberskie"),
    ("assets/booksy/biz/salon-03.jpeg", "Wnętrze zakładu"),
    ("assets/booksy/biz/salon-04.jpeg", "Detal wyposażenia"),
    ("assets/booksy/biz/salon-05.jpeg", "Wnętrze zakładu"),
    ("assets/booksy/biz/salon-06.jpeg", "Wnętrze zakładu"),
    ("assets/booksy/biz/cover.jpeg", "Zakład Fryzjerstwa Męskiego"),
]

NAWIGACJA = [
    ("uslugi.html", "usługi"),
    ("galeria.html", "galeria"),
    ("zespol.html", "zespół"),
    ("kontakt.html", "kontakt"),
]

AKCENT = "#9db596"

# ---------------------------------------------------------------- pomocnicze


def esc(t):
    return (str(t).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def jsonld():
    """Dane strukturalne — to one dają wizytówkę w wynikach Google."""
    d = {
        "@context": "https://schema.org",
        "@type": "HairSalon",
        "name": FIRMA["nazwa"],
        "description": FIRMA["opis"],
        "image": "assets/booksy/biz/cover.jpeg",
        "telephone": "+48" + FIRMA["telefon"].replace(" ", ""),
        "priceRange": "50–350 PLN",
        "currenciesAccepted": "PLN",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": FIRMA["ulica"],
            "postalCode": FIRMA["kod"],
            "addressLocality": FIRMA["miasto"],
            "addressCountry": "PL",
        },
        "geo": {"@type": "GeoCoordinates", "latitude": FIRMA["lat"], "longitude": FIRMA["lng"]},
        "sameAs": [LINKI["instagram"], LINKI["facebook"], LINKI["booksy"]],
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": OPINIE_META["ocena_num"],
            "reviewCount": OPINIE_META["liczba"],
        },
        "openingHoursSpecification": [
            {"@type": "OpeningHoursSpecification",
             "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
             "opens": "09:00", "closes": "20:00"},
            {"@type": "OpeningHoursSpecification",
             "dayOfWeek": ["Saturday"], "opens": "10:00", "closes": "17:00"},
        ],
        "makesOffer": [
            {"@type": "Offer", "name": n, "priceCurrency": "PLN", "price": c}
            for _, _, us in CENNIK for (n, c, _t, _o) in us
        ],
    }
    return json.dumps(d, ensure_ascii=False, indent=1)


def head(title, desc, extra_css=""):
    return f"""<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}"/>
<meta name="theme-color" content="#000000"/>
<meta property="og:title" content="{esc(title)}"/>
<meta property="og:description" content="{esc(desc)}"/>
<meta property="og:type" content="website"/>
<meta property="og:image" content="assets/booksy/biz/cover.jpeg"/>
<meta property="og:locale" content="pl_PL"/>
<link rel="icon" type="image/svg+xml" href="favicon.svg"/>
<link rel="icon" type="image/png" sizes="96x96" href="favicon/96-96.png"/>
<link rel="apple-touch-icon" sizes="180x180" href="favicon/180-180.png"/>
<link rel="icon" href="favicon.ico"/>
<link rel="manifest" href="manifest.json"/>
<link rel="stylesheet" href="css/global.css"/>
<link rel="stylesheet" href="css/page.css"/>
<link rel="stylesheet" href="css/theme.css"/>
<link rel="stylesheet" href="css/sections.css"/>
<link rel="stylesheet" href="css/nav.css"/>{extra_css}
<script type="application/ld+json">
{jsonld()}
</script>
</head>
<body>
<div id="__next">
"""


def svg_filters():
    return """  <svg class="svg-filters_root__Puy8T" aria-hidden="true" focusable="false">
    <defs>
      <filter id="threshold">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0" result="blur"/>
        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 0"/>
      </filter>
    </defs>
  </svg>
"""


def header(active=None):
    """
    Pasek nawigacji: marka po lewej, komplet odnosnikow i CTA po prawej,
    ponizej 900 px hamburger otwierajacy pelnoekranowy panel.
    """
    out = ['  <header id="header" class="nav" data-nav style="opacity:0">',
           '    <a class="nav__brand" href="index.html">',
           '      <span class="nav__mark" data-logo></span>',
           '      <span class="nav__brandText">zakład fryzjerstwa męskiego</span>',
           '    </a>',
           '',
           '    <div class="nav__right">',
           '      <nav class="nav__links" aria-label="Nawigacja główna">']

    for href, label in NAWIGACJA:
        cur = ' aria-current="page"' if active == href else ''
        out.append(
            '        <a class="nav__link" href="%s"%s>%s'
            '<span class="handwrite-overlay_root__oa9z7 nav__hand" style="color:%s" '
            'data-handwrite="%s" data-color="%s">'
            '<span class="handwrite-overlay_hiddenText__vgaeM">%s</span></span></a>'
            % (href, cur, esc(label), AKCENT, esc(label), AKCENT, esc(label)))

    out += ['      </nav>',
            '      <a class="nav__cta" href="%s" target="_blank" rel="noopener">Rezerwuj</a>' % LINKI['booksy'],
            '      <button class="nav__burger" type="button" data-burger aria-expanded="false"',
            '              aria-controls="menu" aria-label="Menu">',
            '        <span></span><span></span><span></span>',
            '      </button>',
            '    </div>',
            '  </header>',
            '']

    # pelnoekranowy panel mobilny
    out += ['  <div class="menu" id="menu" data-menu>',
            '    <nav aria-label="Nawigacja mobilna">']
    for href, label in NAWIGACJA:
        cur = ' aria-current="page"' if active == href else ''
        out.append('      <a class="menu__link" href="%s"%s>%s</a>' % (href, cur, esc(label)))
    out += ['      <a class="menu__cta" href="%s" target="_blank" rel="noopener">Rezerwuj w Booksy</a>'
            % LINKI['booksy'],
            '    </nav>',
            '    <div class="menu__foot">',
            '      <a href="%s">%s</a>' % (FIRMA['telefon_href'], FIRMA['telefon']),
            '      <a href="%s" target="_blank" rel="noopener">%s</a>' % (LINKI['mapa'], esc(FIRMA['ulica'])),
            '      <span data-open-now>Godziny</span>',
            '    </div>',
            '  </div>',
            '']
    return "\n".join(out) + "\n"


def preloader():
    return """  <div class="preloader_root__KN4wH">
    <div class="preloader_content__OcKjQ" style="opacity:0;filter:blur(34px)">
      <span class="preloader_counter__1q2kg"><span class="preloader_value__bLGU1">00</span></span>
    </div>
  </div>
"""


def hours_table(mark_today=True):
    rows = []
    for i, (d, o, c) in enumerate(GODZINY):
        today = ' data-today' if mark_today else ''
        val = f"{o}–{c}" if o else '<span class="is-closed">nieczynne</span>'
        rows.append(f'          <tr data-day="{i}"><td>{d}</td><td>{val}</td></tr>')
    return ('        <table class="hours">\n<tbody>\n' + "\n".join(rows) +
            '\n</tbody>\n        </table>')


# graffiti w tle stopki - napisy odreczne wygenerowane przez
# _tools/export-graffiti.cjs; kolejnosc odpowiada pozycjom z szablonu
BG_GRAFFITI = [
    ("assets-svg", "svg/graffiti/wilda.svg", -7),
    ("assets-svg", "svg/graffiti/fade.svg", 5),
    ("assets-svg", "svg/graffiti/broda.svg", -4),
    ("assets-svg", "svg/graffiti/combo.svg", 8),
    ("assets-svg", "svg/graffiti/barber.svg", -6),
    ("assets-svg", "svg/graffiti/poznan.svg", 4),
]


def footer():
    """
    Stopka = sekcja kontaktu w ukladzie z szablonu: rozrzucone zdjecia
    w tle, wielki tytul, wysrodkowane dane i drobny podpis na dole.
    Ten sam blok konczy kazda strone.
    """
    zdjecia = "\n".join(
        '        <img class="graffiti" src="%s" alt="" aria-hidden="true" style="--rot:%ddeg"/>'
        % (src, rot) for _k, src, rot in BG_GRAFFITI)

    pozycje = [
        ("Adres", "%s, %s %s" % (esc(FIRMA["ulica"]), FIRMA["kod"], esc(FIRMA["miasto"])),
         LINKI["mapa"], True),
        ("Telefon", FIRMA["telefon"], FIRMA["telefon_href"], False),
        ("Rezerwacja", "Booksy", LINKI["booksy"], True),
        ("Godziny", None, None, False),
    ]
    items = []
    for tytul, wartosc, href, blank in pozycje:
        items.append('          <div class="contact-section_contactItem__Q8ucj">')
        items.append('            <h3 class="contact-section_contactItemTitle__13wo5">%s</h3>' % tytul)
        if wartosc is None:
            items.append('            <span class="button_root__xL6bS '
                         'contact-section_contactItemValue__eQtfA" data-open-now>Pn-Pt 09-20</span>')
        else:
            tgt = ' target="_blank" rel="noopener"' if blank else ''
            items.append('            <a class="button_root__xL6bS '
                         'contact-section_contactItemValue__eQtfA" href="%s"%s>%s</a>'
                         % (href, tgt, wartosc))
        items.append('          </div>')

    return """  <div class="window-section-wrapper_root__m5TTH home-page_contactWindow__Cqq4f"
       data-window="contact" data-window-section-wrapper="contact">
    <footer class="contact-section_root__pq_Cl">
      <div class="contact-section_animatedBg__B9g_u">
%(zdjecia)s
      </div>
      <div class="contact-section_content__tDXtS" id="kontakt">
        <div class="inner-animation-gooey_root__mcvW7 contact-section_title__BU1nF" data-gooey>
          <h2>Wilda<br/>Poznań</h2>
        </div>
        <div class="contact-section_contactItems__BH4BS">
%(items)s
        </div>
        <div class="contact-section_whomade__QYAJ_">
          <a class="button_root__xL6bS" href="%(ig)s" target="_blank" rel="noopener">Instagram</a>
          &nbsp;x&nbsp;
          <a class="button_root__xL6bS" href="%(fb)s" target="_blank" rel="noopener">Facebook</a>
        </div>
      </div>
    </footer>
  </div>
""" % {"zdjecia": zdjecia, "items": "\n".join(items),
       "ig": LINKI["instagram"], "fb": LINKI["facebook"]}


def cta(text="Umów się na wizytę"):
    return f"""  <section class="cta">
    <div class="cta__text">{esc(text)}</div>
    <div style="display:flex;gap:1rem;flex-wrap:wrap">
      <a class="btn btn--primary" href="{LINKI['booksy']}" target="_blank" rel="noopener">Rezerwuj w Booksy</a>
      <a class="btn btn--ghost" href="{FIRMA['telefon_href']}">{FIRMA['telefon']}</a>
    </div>
  </section>
"""


SCRIPTS = """
<script src="js/vendor/gsap.min.js"></script>
<script src="js/vendor/ScrollTrigger.min.js"></script>
<script src="js/vendor/CustomEase.min.js"></script>
<script src="js/vendor/Observer.min.js"></script>
<script src="js/vendor/ScrollToPlugin.min.js"></script>
<script src="js/vendor/lenis.min.js"></script>
<script src="js/vendor/opentype.min.js"></script>
<script src="js/data.js"></script>
<script src="js/gooey.js"></script>
<script src="js/handwrite.js"></script>
<script src="js/badtv.js"></script>
<script src="js/split-text.js"></script>
<script src="js/app.js"></script>
</body>
</html>
"""


def shell(title, desc, active, body, with_preloader=True):
    """Składa kompletną stronę: head + nagłówek + kontener scrolla + treść."""
    return (head(title, desc) + svg_filters() + header(active) +
            (preloader() if with_preloader else "") +
            '  <div id="scroll" class="scroll_wrap__kC5PE">\n'
            '    <div class="scroll_content__SD1RT">\n'
            '      <main>\n' + body +
            '      </main>\n    </div>\n  </div>\n</div>\n' + SCRIPTS)


def main():
    from build_pages import main as build_pages
    build_pages()


if __name__ == "__main__":
    main()
