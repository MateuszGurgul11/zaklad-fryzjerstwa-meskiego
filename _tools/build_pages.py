#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Definicje poszczególnych stron. Uruchamiane przez `python _tools/build.py`
(albo bezpośrednio: `python _tools/build_pages.py`).

Fragmenty wspólne — head, nagłówek, stopka, dane — mieszkają w build.py.
"""
import io
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from build import (ROOT, FIRMA, LINKI, OPINIE_META, GODZINY, ZESPOL, CENNIK,
                   CYTATY, GALERIA, AKCENT, esc, shell, footer, cta)

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

TR = str.maketrans("łóąęśćźżń", "loaescnzn")


# ---------------------------------------------------------------- fragmenty

def pricing_html(kategorie=None):
    out = []
    for nazwa, opis, uslugi in (kategorie or CENNIK):
        anchor = re.sub(r"[^a-z0-9]+", "-", nazwa.lower().translate(TR)).strip("-")
        out.append('      <div class="pricing__cat" id="%s" data-reveal-row>' % anchor)
        out.append('        <div class="pricing__catHead">')
        out.append('          <h2 class="pricing__catName">%s</h2>' % esc(nazwa))
        out.append('          <p class="pricing__catNote">%s</p>' % esc(opis))
        out.append('        </div>')
        for n, cena, czas, o in uslugi:
            out.append('        <div class="pricing__row">')
            out.append('          <div><div class="pricing__name">%s</div>%s</div>'
                       % (esc(n), ('<p class="pricing__desc">%s</p>' % esc(o)) if o else ''))
            out.append('          <div class="pricing__time">%d min</div>' % czas)
            out.append('          <div class="pricing__price">%d zł</div>' % cena)
            out.append('        </div>')
        out.append('      </div>')
    return "\n".join(out)


def team_html():
    out = ['      <div class="team">']
    for imie, nick, foto, wideo in ZESPOL:
        out.append('        <article class="team__card" data-reveal>')
        out.append('          <div class="team__photo">')
        out.append('            <img src="%s" alt="%s — barber" loading="lazy"/>' % (foto, esc(imie)))
        if wideo:
            out.append('            <video class="team__video" src="%s"' % wideo)
            out.append('                   muted loop playsinline preload="metadata" aria-hidden="true"></video>')
        out.append('          </div>')
        out.append('          <h3 class="team__name">%s</h3>' % esc(imie))
        if nick:
            out.append('          <p class="team__nick">%s</p>' % esc(nick))
        out.append('        </article>')
    out.append('      </div>')
    return "\n".join(out)


def reviews_html(limit=6):
    out = ['      <div class="reviews__grid">']
    for tekst, autor, kiedy in CYTATY[:limit]:
        out.append('        <blockquote class="review" data-reveal>')
        out.append('          <div class="review__stars">★★★★★</div>')
        out.append('          <p class="review__text">%s</p>' % esc(tekst))
        out.append('          <footer class="review__author">%s · %s · Booksy</footer>'
                   % (esc(autor), esc(kiedy)))
        out.append('        </blockquote>')
    out.append('      </div>')
    return "\n".join(out)


def gallery_html(items=None):
    out = ['      <div class="gallery">']
    for i, (src, alt) in enumerate(items or GALERIA):
        wide = ' gallery__item--wide' if i % 5 == 2 else ''
        out.append('        <figure class="gallery__item%s" data-reveal>'
                   '<img src="%s" alt="%s" loading="lazy"/></figure>' % (wide, src, esc(alt)))
    out.append('      </div>')
    return "\n".join(out)


def hours_table():
    rows = []
    for i, (d, o, c) in enumerate(GODZINY):
        val = ("%s–%s" % (o, c)) if o else '<span class="is-closed">nieczynne</span>'
        rows.append('              <tr data-day="%d"><td>%s</td><td>%s</td></tr>' % (i, d, val))
    return ('            <table class="hours"><tbody>\n' + "\n".join(rows) +
            '\n            </tbody></table>')


# ---------------------------------------------------------------- strony

ABOUT_PARTS = [
    {"text": "Strzyżemy na Wildzie. Krótkie formy użytkowe i"},
    {"accent": "fade", "link": "uslugi.html#strzyzenie"},
    {"text": ", pełne"},
    {"accent": "combo", "link": "uslugi.html#combo"},
    {"text": "z aromaterapią i brzytwą,"},
    {"accent": "broda", "link": "uslugi.html#strzyzenie"},
    {"text": "od konturu po odsiwianie,"},
    {"accent": "trwała", "link": "uslugi.html#lukasz"},
    {"text": "do dziewięciu tygodni oraz wizyty"},
    {"accent": "tata i syn", "link": "uslugi.html#tata-i-syn"},
    {"text": "."},
]

MOUSE_ICON = (
    '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" '
    'class="icon_root__850sC hero-section_icon__agoNi" aria-hidden="true"><g opacity="0.24">'
    '<path d="M4 6C4 4.93913 4.42143 3.92172 5.17157 3.17157C5.92172 2.42143 6.93913 2 8 2C9.06087 '
    '2 10.0783 2.42143 10.8284 3.17157C11.5786 3.92172 12 4.93913 12 6V10C12 11.0609 11.5786 12.0783 '
    '10.8284 12.8284C10.0783 13.5786 9.06087 14 8 14C6.93913 14 5.92172 13.5786 5.17157 12.8284C4.42143 '
    '12.0783 4 11.0609 4 10V6Z" stroke="#edf1ea" stroke-width="2" stroke-linejoin="round"/>'
    '<path d="M8 4.66602V7.33268" stroke="#edf1ea" stroke-width="2" stroke-linecap="round" '
    'stroke-linejoin="round"/></g></svg>'
)


def page_index():
    hero = """        <div class="home-page_heroWrapper__0Eh8U">
          <section class="hero-section_root__ZsTA_ home-page_hero__pSBct">
            <div class="hero-section_greating__1OyC1">
              <div data-gooey><h1 class="hero-section_title__DTVen">Zakład
Fryzjerstwa
Męskiego</h1></div>
              <div class="handwrite-overlay_root__oa9z7 hero-section_handwrite__h878T"
                   style="color:%(a)s" data-handwrite="Wilda" data-color="%(a)s">
                <span class="handwrite-overlay_hiddenText__vgaeM">Wilda</span>
              </div>
            </div>
            <div class="hero-section_about__OlYeE">
              <div class="hero-section_gifWrapper__1Fy_P">
                <img src="assets/booksy/logo/logo.jpeg" alt="Logo zakładu"
                     class="hero-section_headGif__mEIXP"
                     style="opacity:0;filter:blur(0.3em);border-radius:50%%;object-fit:cover"/>
              </div>
              <div class="line-by-line-animation_root__Mnh69 hero-section_text__GA552 hero-section_hiddenText__LBjYV">
                <p data-split>%(opis)s <strong><a href="%(booksy)s" target="_blank" rel="noopener">Zapisy przez Booksy</a></strong>.</p>
              </div>
            </div>
            <div class="hero-section_scrollDown__MUcli">
              <div class="hero-section_scrollDownIcon__Uo2WA">%(icon)s</div>
              <span class="hero-section_scrollDownText__ncHry" data-scroll-word>przewiń</span>
            </div>
          </section>
        </div>
""" % {"a": AKCENT, "opis": esc(FIRMA["opis"]), "booksy": LINKI["booksy"], "icon": MOUSE_ICON}

    uslugi = """        <div class="window-section-wrapper_root__m5TTH home-page_projectsWindow__efvqh"
             data-window="services" data-window-section-wrapper="services" id="uslugi">
          <div class="projects-section_root__aoLKL home-page_content__2n5v8" style="--list-height:0px;--margin-bottom:0px">
            <button type="button" aria-label="przewiń do usług"
                    class="projects-section_scrollButton__6jB7I projects-section_enableScrollButton__losoq" data-scroll-btn></button>
            <div class="projects-section_videoBg__vUKwc">
              <div class="bad-tv-video_root__LV2Sf" role="img" aria-label="Zdjęcia z zakładu">
                <div class="bad-tv-video_canvas__T5_8S" data-badtv></div>
              </div>
            </div>
            <div class="projects-section_projectsListWrapper__023fW">
              <ul class="projects-section_projectsList__ORU43" data-services-list></ul>
            </div>
          </div>
        </div>
"""

    about = """        <section class="about-section_root____3vv" id="o-nas">
          <h2 class="about-section_title__vZ6sb" data-about-title='%s'></h2>
          <p class="line-by-line-animation_root__Mnh69 about-section_description__S5CUq"
             data-split="%s"></p>
        </section>
""" % (json.dumps(ABOUT_PARTS, ensure_ascii=False).replace("'", "&#39;"),
       esc(FIRMA["opis"] + " " + FIRMA["wiek"] + " " + FIRMA["polityka"]))

    zespol = """        <section class="section" id="zespol">
          <div class="section__head">
            <div>
              <span class="eyebrow">Zespół</span>
              <h2 class="section__title" data-gooey-scroll><span>Trzy pary rąk</span></h2>
            </div>
            <p class="section__lead">Paula, Zosia i Łukasz. Każde z nas ma swój styl —
            barbera wybierasz przy rezerwacji w Booksy.</p>
          </div>
%s
        </section>
""" % team_html()

    opinie = """        <section class="section section--black" id="opinie">
          <div class="section__head">
            <div>
              <span class="eyebrow">Opinie</span>
              <div class="reviews__score">
                <span class="reviews__value" data-count-to="5" data-count-decimals="1">0,0</span>
                <span class="reviews__meta">na podstawie<br/><strong data-count-to="%d">0</strong> opinii w Booksy</span>
              </div>
            </div>
            <p class="section__lead">542 z 549 osób wystawiło maksymalną ocenę.
            Poniżej kilka z nich — pełna lista jest w Booksy.</p>
          </div>
%s
        </section>
""" % (OPINIE_META["liczba"], reviews_html())

    body = ('        <div class="home-page_root__Btl_R" id="top">\n' +
            hero + uslugi + about + zespol + opinie +
            '        </div>\n')

    return shell(FIRMA["nazwa"] + " — barbershop Wilda, Poznań",
                 "Barbershop na Wildzie w Poznaniu. Strzyżenie męskie, fade, broda, "
                 "combo z brzytwą. Ocena 5,0 z 549 opinii. Rezerwacja online przez Booksy.",
                 None, body)


def page_uslugi():
    body = """        <section class="page">
          <span class="eyebrow">Cennik</span>
          <h1 class="page__title">Usługi<br/>i ceny</h1>
          <p class="page__lead">Pełna lista zabiegów z czasem trwania. Ceny takie same jak w Booksy —
          rezerwując online widzisz dokładny termin i barbera.</p>
        </section>

        <section class="section">
%s
        </section>
%s
""" % (pricing_html(), cta("Wybrałeś usługę?"))
    return shell("Cennik — " + FIRMA["nazwa"],
                 "Cennik barbershopu na Wildzie: strzyżenie męskie od 50 zł, fade 90 zł, "
                 "broda 70 zł, combo od 130 zł, trwała do 350 zł.",
                 "uslugi.html", body)


def page_zespol():
    body = """        <section class="page">
          <span class="eyebrow">O nas</span>
          <h1 class="page__title">Zespół</h1>
          <p class="page__lead">%(opis)s</p>
        </section>

        <section class="section">
%(team)s
        </section>

        <section class="section section--black">
          <div class="section__head">
            <div>
              <span class="eyebrow">Jak pracujemy</span>
              <h2 class="section__title" data-gooey-scroll><span>Bez pośpiechu</span></h2>
            </div>
          </div>
          <div class="info">
            <div data-reveal>
              <div class="info__label">Rezerwacja</div>
              <p class="info__body">Zapisy przez Booksy albo wiadomość na Instagramie.
              %(polityka)s</p>
            </div>
            <div data-reveal>
              <div class="info__label">Kogo strzyżemy</div>
              <p class="info__body">%(wiek)s Najmłodszych obsługujemy w ramach pakietów
              „tata i syn”.</p>
            </div>
            <div data-reveal>
              <div class="info__label">Udogodnienia</div>
              <p class="info__body">Płatność kartą.<br/>Zwierzęta mile widziane.</p>
            </div>
          </div>
        </section>
%(cta)s
""" % {"opis": esc(FIRMA["opis"]), "team": team_html(), "polityka": esc(FIRMA["polityka"]),
       "wiek": esc(FIRMA["wiek"]), "cta": cta()}
    return shell("Zespół — " + FIRMA["nazwa"],
                 "Paula, Zosia i Łukasz — barberzy Zakładu Fryzjerstwa Męskiego "
                 "na Wildzie w Poznaniu.", "zespol.html", body)


def page_galeria():
    body = """        <section class="page">
          <span class="eyebrow">Galeria</span>
          <h1 class="page__title">Nasze<br/>realizacje</h1>
          <p class="page__lead">Efekty pracy i wnętrze zakładu. Więcej codziennie
          na <a href="%s" target="_blank" rel="noopener">Instagramie</a>.</p>
        </section>

        <section class="section">
%s
        </section>
%s
""" % (LINKI["instagram"], gallery_html(), cta("Chcesz tak samo?"))
    return shell("Galeria — " + FIRMA["nazwa"],
                 "Zdjęcia strzyżeń, fade i brody oraz wnętrze barbershopu "
                 "na Wildzie w Poznaniu.", "galeria.html", body)


def page_kontakt():
    mapa = ("https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2434.3949636534862"
            "!2d16.923620876558942!3d52.39951767202986!2m3!1f0!2f0!3f0!3m2!1i1024!2i768"
            "!4f13.1!3m3!1m2!1s0x47045b736c23d5a9%3A0xdc2aaf98baf3dc3d"
            "!2sZak%C5%82ad%20Fryzjerstwa%20M%C4%99skiego%20Barber%20Shop"
            "!5e0!3m2!1spl!2spl!4v1787576203519!5m2!1spl!2spl")
    body = """        <section class="page">
          <span class="eyebrow">Kontakt</span>
          <h1 class="page__title">Wpadnij<br/>na Wildę</h1>
          <p class="page__lead">%(ulica)s, %(kod)s %(miasto)s.
          Najprościej umówić się przez Booksy — widzisz wolne terminy na bieżąco.</p>
        </section>

        <section class="section">
          <div class="info">
            <div data-reveal>
              <div class="info__label">Adres</div>
              <p class="info__body"><a href="%(mapa_link)s" target="_blank" rel="noopener">
                %(ulica)s<br/>%(kod)s %(miasto)s<br/>%(dzielnica)s</a></p>
            </div>
            <div data-reveal>
              <div class="info__label">Telefon i social media</div>
              <p class="info__body">
                <a href="%(tel_href)s">%(tel)s</a><br/>
                <a href="%(ig)s" target="_blank" rel="noopener">Instagram</a><br/>
                <a href="%(fb)s" target="_blank" rel="noopener">Facebook</a>
              </p>
            </div>
            <div data-reveal>
              <div class="info__label">Godziny otwarcia</div>
%(hours)s
            </div>
          </div>
        </section>

        <section class="section section--tight">
          <iframe class="map" title="Mapa dojazdu"
                  src="%(mapa)s"
                  allowfullscreen="" loading="lazy"
                  referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </section>
%(cta)s
""" % {"ulica": esc(FIRMA["ulica"]), "kod": FIRMA["kod"], "miasto": esc(FIRMA["miasto"]),
       "dzielnica": esc(FIRMA["dzielnica"]), "mapa_link": LINKI["mapa"], "mapa": mapa,
       "tel_href": FIRMA["telefon_href"], "tel": FIRMA["telefon"],
       "ig": LINKI["instagram"], "fb": LINKI["facebook"],
       "hours": hours_table(), "cta": cta()}
    return shell("Kontakt — " + FIRMA["nazwa"],
                 "Zakład Fryzjerstwa Męskiego, ul. Niedziałkowskiego 2, Poznań Wilda. "
                 "Telefon 536 880 760, rezerwacja przez Booksy. Pn–Pt 9–20, sob 10–17.",
                 "kontakt.html", body)


PAGES = {
    "index.html": page_index,
    "uslugi.html": page_uslugi,
    "zespol.html": page_zespol,
    "galeria.html": page_galeria,
    "kontakt.html": page_kontakt,
}


def main():
    for name, fn in PAGES.items():
        html = fn()
        html = html.replace("      </main>\n", footer() + "      </main>\n")
        with io.open(os.path.join(ROOT, name), "w", encoding="utf-8", newline="\n") as f:
            f.write(html)
        print("zapisano  %-16s %6d B" % (name, len(html.encode("utf-8"))))


if __name__ == "__main__":
    main()
