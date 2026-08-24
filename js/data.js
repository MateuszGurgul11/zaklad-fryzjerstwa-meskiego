/* =============================================================
   DANE ZAKŁADU
   =============================================================
   Źródła (pobrane 21.08.2026):
     - Booksy, profil 129109 — usługi, ceny, czasy, opinie, zdjęcia,
       godziny, zespół, dane firmy
     - Instagram @zaklad_fryzjerstwa_meskiego — opis profilu, telefon
   Surowe odpowiedzi API leżą w _tools/biz.json i _tools/booksy_reviews.json.
   ============================================================= */
window.DATA = {

  firma: {
    nazwa: 'Zakład Fryzjerstwa Męskiego',
    nazwaKrotka: 'Zakład',
    tagline: 'Barbershop • Wilda, Poznań',
    opis: 'Miejsce, w którym poczujesz się swobodnie, zapomnisz na chwilę ' +
          'o galopującym świecie. Wyjdziesz od nas naładowany pozytywną energią ' +
          'oraz ze świetną fryzurą.',
    podmiot: 'BEAUTY I BARBER SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ',
    ulica: 'ul. Mieczysława Niedziałkowskiego 2',
    kod: '61-578',
    miasto: 'Poznań',
    dzielnica: 'Wilda',
    telefon: '536 880 760',
    telefonHref: 'tel:+48536880760',
    geo: { lat: 52.39952001, lng: 16.92594 },
    ograniczenieWieku: 'Zapraszamy osoby od 16 roku życia.',
    politykaRezerwacji: 'Zmiany w rezerwacji możliwe do 1 godziny przed wizytą.'
  },

  linki: {
    booksy: 'https://booksy.com/pl-pl/129109_zaklad-fryzjerstwa-meskiego_barber-shop_15608_poznan',
    instagram: 'https://www.instagram.com/zaklad_fryzjerstwa_meskiego/',
    facebook: 'https://www.facebook.com/zakladfryzjerstwameskiego/',
    mapa: 'https://www.google.com/maps/search/?api=1&query=52.39952001,16.92594'
  },

  opinie: {
    ocena: 5.0,
    ocenaDokladna: 4.97,
    liczba: 549,
    rozklad: { 5: 542, 4: 3, 3: 0, 2: 0, 1: 3 },
    zrodlo: 'Booksy'
  },

  godziny: [
    { dzien: 'Poniedziałek', od: '09:00', do: '20:00' },
    { dzien: 'Wtorek',       od: '09:00', do: '20:00' },
    { dzien: 'Środa',        od: '09:00', do: '20:00' },
    { dzien: 'Czwartek',     od: '09:00', do: '20:00' },
    { dzien: 'Piątek',       od: '09:00', do: '20:00' },
    { dzien: 'Sobota',       od: '10:00', do: '17:00' },
    { dzien: 'Niedziela',    od: null,    do: null }
  ],

  udogodnienia: [
    'Płatność kartą',
    'Zwierzęta mile widziane',
    'Rezerwacja online przez Booksy'
  ],

  zespol: [
    { imie: 'Paula',  pseudonim: 'Bejbik', foto: 'assets/booksy/staff/paula.jpeg' },
    { imie: 'Zosia',  pseudonim: null,     foto: 'assets/booksy/staff/zosia.jpeg' },
    { imie: 'Łukasz', pseudonim: 'Łuki Zyss Zysnarski', foto: 'assets/booksy/staff/luki.jpeg' }
  ],

  /* Cennik dokładnie jak na Booksy. „ŁUKASZ" to osobna, wyższa taryfa
     jednego z barberów — na Booksy jest oddzielną kategorią. */
  cennik: [
    {
      kategoria: 'Strzyżenie',
      opis: 'Podstawa. Mycie, cięcie, stylizacja.',
      uslugi: [
        { nazwa: 'Strzyżenie maszynką na jedną długość', cena: 50, czas: 30,
          opis: 'Strzyżenie jedną nakładką całej głowy lub golenie głowy na zero.' },
        { nazwa: 'Tylko boki', cena: 70, czas: 40,
          opis: 'Mycie, strzyżenie samych boków, stylizacja.' },
        { nazwa: 'Strzyżenie brody', cena: 70, czas: 45,
          opis: 'Konturowanie i strzyżenie brody, stylizacja.' },
        { nazwa: 'Buzz cut', cena: 80, czas: 45,
          opis: 'Precyzyjne strzyżenie maszynką.' },
        { nazwa: 'Strzyżenie męskie — fade', cena: 90, czas: 60,
          opis: 'Mycie głowy, strzyżenie włosów krótkich, stylizacja. Wszystkie krótkie formy użytkowe: crop, side part, quiff — z bokami wygolonymi maszynką.' },
        { nazwa: 'Strzyżenie włosów średnich i długich', cena: 120, czas: 70,
          opis: 'Mycie głowy, strzyżenie, stylizacja. Formy wykonywane głównie nożyczkami.' }
      ]
    },
    {
      kategoria: 'Combo',
      opis: 'Włosy i broda w jednej wizycie. Z aromaterapią i brzytwą.',
      uslugi: [
        { nazwa: 'Combo krótkie włosy', cena: 130, czas: 105,
          opis: 'Mycie, modelowanie i dobór produktów do włosów i brody.' },
        { nazwa: 'Combo długie włosy', cena: 160, czas: 120,
          opis: 'Strzyżenie, mycie głowy, modelowanie, trymerowanie brody, aromaterapia wapozonem otwierająca pory, podgolenie brzytwą lub shaverem.' },
        { nazwa: 'Combo z odsiwianiem brody', cena: 180, czas: 130,
          opis: 'Pełne combo uzupełnione o odsiwianie brody.' },
        { nazwa: 'Combo z odsiwianiem — broda i głowa', cena: 230, czas: 140,
          opis: 'Pełne combo z odsiwianiem brody i włosów.' }
      ]
    },
    {
      kategoria: 'Tata i syn',
      opis: 'Wizyta we dwóch. Dla najmłodszych klientów z opiekunem.',
      uslugi: [
        { nazwa: 'Strzyżenie dzieci 7–12 lat', cena: 70, czas: 60, opis: null },
        { nazwa: 'Strzyżenie tata i synek do 8 lat', cena: 140, czas: 120, opis: null },
        { nazwa: 'Brodaty tata i syn do 8 lat', cena: 170, czas: 165, opis: null }
      ]
    },
    {
      kategoria: 'Łukasz',
      opis: 'Osobna taryfa. Tu również trwała utrzymująca się do 9 tygodni.',
      uslugi: [
        { nazwa: 'Strzyżenie brody', cena: 90, czas: 30, opis: null },
        { nazwa: 'Strzyżenie męskie — fade', cena: 100, czas: 40, opis: null },
        { nazwa: 'Strzyżenie średnich i długich włosów', cena: 120, czas: 45, opis: null },
        { nazwa: 'Combo krótkie włosy', cena: 150, czas: 50, opis: null },
        { nazwa: 'Combo długie włosy', cena: 180, czas: 60, opis: null },
        { nazwa: 'Combo krótkie włosy z odsiwianiem brody lub głowy', cena: 200, czas: 70, opis: null },
        { nazwa: 'Trwała do 9 tygodni — tylko góra', cena: 240, czas: 75, opis: null },
        { nazwa: 'Trwała do 9 tygodni — cała głowa', cena: 290, czas: 80, opis: null },
        { nazwa: 'Trwała do 9 tygodni — tylko góra + strzyżenie', cena: 300, czas: 95, opis: null },
        { nazwa: 'Trwała do 9 tygodni — cała głowa + strzyżenie', cena: 350, czas: 115, opis: null }
      ]
    }
  ],

  /* Najpopularniejsze — wyróżnione na Booksy, pokazywane na stronie głównej */
  popularne: ['Strzyżenie męskie — fade', 'Combo krótkie włosy', 'Tylko boki'],

  /* Placeholdery Pexels tylko dla pinu hero (okno usług / Bad TV).
     Galeria na podstronie zostaje na zdjęciach z Booksy. */
  heroTlo: [
    { src: 'assets/pexels/hero-01.jpg', alt: 'Barber modeluje włosy klienta' },
    { src: 'assets/pexels/hero-02.jpg', alt: 'Strzyżenie w barbershopie' },
    { src: 'assets/pexels/hero-03.jpg', alt: 'Strzyżenie maszynką' },
    { src: 'assets/pexels/hero-04.jpg', alt: 'Przycinanie brody nożyczkami' },
    { src: 'assets/pexels/hero-05.jpg', alt: 'Strzyżenie brody w salonie' },
    { src: 'assets/pexels/hero-06.jpg', alt: 'Narzędzia barbera' },
    { src: 'assets/pexels/hero-07.jpg', alt: 'Trymer przy strzyżeniu męskim' }
  ],

  galeria: [
    { src: 'assets/booksy/inspiration/praca-01.jpeg', alt: 'Efekt pracy — strzyżenie męskie' },
    { src: 'assets/booksy/inspiration/praca-02.jpeg', alt: 'Efekt pracy — fade' },
    { src: 'assets/booksy/inspiration/praca-03.jpeg', alt: 'Efekt pracy — broda' },
    { src: 'assets/booksy/inspiration/praca-04.jpeg', alt: 'Efekt pracy — combo' },
    { src: 'assets/booksy/biz/salon-01.jpeg', alt: 'Wnętrze zakładu' },
    { src: 'assets/booksy/biz/salon-02.jpeg', alt: 'Stanowisko barberskie' },
    { src: 'assets/booksy/biz/salon-03.jpeg', alt: 'Wnętrze zakładu' },
    { src: 'assets/booksy/biz/salon-04.jpeg', alt: 'Detal wyposażenia' },
    { src: 'assets/booksy/biz/salon-05.jpeg', alt: 'Wnętrze zakładu' },
    { src: 'assets/booksy/biz/salon-06.jpeg', alt: 'Wnętrze zakładu' },
    { src: 'assets/booksy/biz/cover.jpeg', alt: 'Zakład Fryzjerstwa Męskiego' }
  ],

  /* Opinie z Booksy — wybrane, z pełną treścią. Nazwiska skrócone tak,
     jak udostępnia je Booksy. */
  cytaty: [
    { tekst: 'Pierwsza wizyta u Pauli i to było chyba najlepsze cięcie w życiu. Serio, totalny powiew świeżości jeśli chodzi o fryzurę i super atmosfera w trakcie. Bardzo mocno polecam!',
      autor: 'Mateusz L.', data: '2026-05-20' },
    { tekst: 'Prze-rewelacyjnie! Z dokładnością „co do włoska”. Mega modnie! Polecam „jak nie wiem”!',
      autor: 'Maciej R.', data: '2026-08-08' },
    { tekst: 'Pierwsza wizyta w tym salonie i bardzo pozytywne zaskoczenie podejściem do klienta. Zosia robi super robotę.',
      autor: 'Patryk T.', data: '2026-06-14' },
    { tekst: 'Pomimo mojego braku zdecydowania i podenerwowania wszystko zostało zrobione perfekcyjnie. Polecam serdecznie!',
      autor: 'Krzysztof R.', data: '2026-06-11' },
    { tekst: 'Wizyta jak zwykle super. Strzyżenie dokładnie tak jak chciałem i za bardzo dobrą stawkę.',
      autor: 'Damian B.', data: '2026-07-01' },
    { tekst: 'Pełen profesjonalizm, strzyżenie męskie perfekcyjne. Polecam.',
      autor: 'Jagoda R.', data: '2026-06-17' },
    { tekst: 'Szybka profesjonalna usługa w przyjemnej atmosferze.',
      autor: 'Przemek K.', data: '2026-08-15' },
    { tekst: 'Bardzo fajnie i miło, polecam miejscówkę, a w szczególności Paulę która mnie dziś strzygła.',
      autor: 'Łukasz G.', data: '2026-06-30' }
  ],

  /* Kolor podpisu odręcznego — paleta marki jest dwukolorowa, więc
     wszystkie akcenty używają rozjaśnionej zieleni (--brand-green-300). */
  akcent: '#9db596',

  /* Stałe animacji „okna" (przeniesione z bundla oryginału) */
  windowSizes: {
    desktop: function () {
      var w = window.innerWidth;
      return { width: 0.1236 * w, height: 0.2101 * w, borderRadius: 64, n: 21.01 };
    },
    tablet: function () {
      var w = window.innerWidth, h = window.innerHeight, land = w > h;
      return { width: land ? 0.262 * h : 0.178 * w, height: land ? 0.178 * w : 0.262 * h,
               borderRadius: 48, n: 26.2 };
    },
    mobile: function () {
      var w = window.innerWidth, h = window.innerHeight, land = w > h;
      return { width: land ? 0.28 * h : 0.28 * w, height: land ? 0.28 * w : 0.28 * h,
               borderRadius: 48, n: 28 };
    }
  },
  expanded: {
    width: function () { return window.innerWidth; },
    height: function () {
      var h = window.innerHeight, w = window.innerWidth;
      return w * (w > h ? w / h : h / w);
    }
  },
  epsilon: { end: 0.999, begin: 0.01 },

  handwriteFont: 'fonts/WindSong/WindSong-Regular.ttf'
};

/* ------------------------------------------------------------------ *
 *  Pomocnicze
 * ------------------------------------------------------------------ */
window.DATA.wszystkieUslugi = function () {
  return window.DATA.cennik.reduce(function (acc, k) {
    return acc.concat(k.uslugi.map(function (u) {
      return Object.assign({ kategoria: k.kategoria }, u);
    }));
  }, []);
};

window.DATA.zakresCen = function () {
  var ceny = window.DATA.wszystkieUslugi().map(function (u) { return u.cena; });
  return { min: Math.min.apply(null, ceny), max: Math.max.apply(null, ceny) };
};
