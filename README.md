# Zakład Fryzjerstwa Męskiego — strona

Statyczna strona barbershopu z Wildy w Poznaniu. Wygląd i animacje pochodzą
z szablonu odtworzonego z artemartemartem.com (leży nietknięty w `_Szablon/`),
treść i paleta są już własne.

## Uruchomienie

```bash
python -m http.server 8322
```

Potem `http://localhost:8322`.

## Strony

| Plik | Zawartość |
|---|---|
| `index.html` | hero, usługi (otwierające się „okno"), o nas, zespół, opinie, kontakt |
| `uslugi.html` | pełny cennik — 23 usługi w 4 kategoriach, z czasem trwania |
| `zespol.html` | o nas, zespół, zasady wizyt |
| `galeria.html` | realizacje i wnętrze |
| `kontakt.html` | adres, telefon, godziny, mapa |

Każda strona ma własne `<title>`, opis, Open Graph i dane strukturalne
`schema.org/HairSalon` (adres, godziny, ocena, pełny cennik) — to one
odpowiadają za wizytówkę w wynikach Google.

## Nawigacja

Marka po lewej, komplet odnośników i przycisk „Rezerwuj” po prawej.
Poniżej 900 px odnośniki chowają się pod hamburger otwierający pełnoekranowy
panel (z telefonem, adresem i dzisiejszymi godzinami na dole).

Szablon używał tu `mix-blend-mode: difference`. Na ciemnej palecie dawało to
szary, słabo czytelny tekst, więc pasek dostał zwykły kolor `--brand-green-100`
i przyciemnianą szybkę z rozmyciem, która pojawia się po odjechaniu od góry
strony. Pismo odręczne przy najechaniu na odnośnik zostało.

## Stopka

Układ przejęty z szablonu bez zmian: pełnoekranowa sekcja kontaktu
z sześcioma zdjęciami rozrzuconymi przy krawędziach, wielkim tytułem
(efekt gooey), wyśrodkowanymi danymi i drobnym podpisem na dole.
Zachowane `mix-blend-mode: difference` i pozycje zdjęć co do procenta.

Zmienione są tylko treści — tytuł, cztery pozycje kontaktowe i podpis.
W tle, zamiast GIF-ów z szablonu, leżą napisy odręczne: *Wilda, fade, broda,
combo, barber, Poznań*. Ten sam blok kończy wszystkie pięć stron.

Graffiti powstaje z fontu Great Rebellion tym samym algorytmem co pismo
odręczne w interfejsie (opentype.js, jeden `<path>` na znak):

```bash
node _tools/export-graffiti.cjs
```

Skrypt zapisuje pliki do `svg/graffiti/`. Listę słów zmienia się w stałej
`SLOWA`, a rozmieszczenie i przekrzywienie w `BG_GRAFFITI` w `_tools/build.py`.
W przeciwieństwie do napisów z `svg/handwrite/` te mają wymiary zgodne
z `viewBox` i gotowe wypełnienie, bo nie są rysowane po kolei — leżą w tle.

## Skąd są dane

Wszystko pobrane 21.08.2026:

- **Booksy** (profil 129109) — usługi, ceny, czasy trwania, opisy, godziny,
  zespół, ocena 5,0 z 549 opinii, 15 zdjęć. Surowe odpowiedzi API: `_tools/biz.json`,
  `_tools/booksy_reviews.json`, `_tools/booksy_ld.json`.
- **Instagram** — opis profilu i telefon. Zdjęcia postów wymagają zalogowanej
  sesji, patrz `_tools/README-instagram.md`.
- **Facebook** — strona odrzuca żądania bez sesji (HTTP 400/301), nic stamtąd nie ma.

## Struktura plików

| Ścieżka | Zawartość |
|---|---|
| `css/global.css`, `css/page.css` | arkusze z szablonu, nietknięte |
| `css/theme.css` | paleta marki: czerń + `#253024` |
| `css/sections.css` | style sekcji dodanych dla barbershopu i podstron |
| `css/nav.css` | pasek nawigacji, hamburger i panel mobilny |
| `js/data.js` | treść i stałe dla warstwy klienckiej |
| `js/app.js` | runtime wspólny dla wszystkich stron |
| `js/gooey.js`, `js/handwrite.js`, `js/split-text.js`, `js/badtv.js` | efekty z szablonu |
| `assets/booksy/` | zdjęcia z Booksy (salon, realizacje, zespół, logo) |
| `assets/instagram/` | awatar profilu |
| `_tools/` | generator stron, pobieranie z Instagrama, surowe dane |
| `_Szablon/` | referencyjna kopia szablonu — nie ruszać |

## Zmiana treści

Strony powstają z generatora:

```bash
python _tools/build.py
```

Dane siedzą w `_tools/build.py` (sekcja `FIRMA`, `CENNIK`, `ZESPOL`, `CYTATY`,
`GALERIA`), a układ stron w `_tools/build_pages.py`. Wynikiem są zwykłe pliki
HTML — można je edytować ręcznie, ale kolejne uruchomienie generatora je nadpisze.

Część renderowana w przeglądarce (lista usług na stronie głównej, licznik opinii,
dzisiejsze godziny) czyta z `js/data.js` — przy zmianie cennika trzeba poprawić
oba miejsca.

## Do zrobienia

- **Zdjęcia i filmy z Instagrama** — 61 postów czeka na pobranie. Potrzebny plik
  `_tools/instagram-cookies.txt`, instrukcja w `_tools/README-instagram.md`.
  Po pobraniu warto podmienić tło sekcji usług (`js/data.js` → `galeria`)
  na filmy — `badtv.js` obsługuje jedno i drugie.
- **89 MB nieużywanych mediów z szablonu** — `gifs/`, `illustrations/`,
  `assets/img/`, `assets/video/` nie są już przez nic wołane. Można skasować,
  ale zostawiam decyzję.
- Formularz kontaktowy, jeśli miałby być inny niż telefon i Booksy.
