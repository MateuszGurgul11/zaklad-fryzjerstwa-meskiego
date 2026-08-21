# Pobieranie mediów z Instagrama

## Stan przygotowań

- `gallery-dl` 1.32.9 zainstalowany (`python -m gallery_dl`)
- `_tools/gallery-dl.conf` — konfiguracja gotowa i sprawdzona (ładuje się poprawnie)
- `assets/instagram/` — katalog docelowy
- `_tools/ig-archive.sqlite` — rejestr pobranych plików, żeby kolejne uruchomienia
  dociągały tylko nowe posty

Brakuje dwóch rzeczy: **adresu profilu** i **pliku z ciasteczkami**.

## Dlaczego potrzebny jest plik z ciasteczkami

Pierwotny plan zakładał, że `gallery-dl` sam odczyta sesję z przeglądarki
(`--cookies-from-browser chrome`). To nie zadziała na tym komputerze:

Chrome i Edge mają włączone **App-Bound Encryption** — sprawdzone, w `Local State`
obu przeglądarek jest klucz `app_bound_encrypted_key`. Od Chrome 127 klucz
ciasteczek jest związany z procesem przeglądarki, więc żaden zewnętrzny program
nie odszyfruje bazy, nawet działając na tym samym koncie Windows. Próba kończy się
`Failed to decrypt cookie (DPAPI)`.

Obejście jest proste: wyeksportować ciasteczka ręcznie do pliku.

## Krok 1 — eksport ciasteczek

1. Zaloguj się na Instagrama w przeglądarce.
2. Zainstaluj rozszerzenie eksportujące ciasteczka w formacie Netscape, np.
   **„Get cookies.txt LOCALLY”** (Chrome Web Store) — działa offline,
   nie wysyła danych nigdzie na zewnątrz.
3. Wejdź na `https://www.instagram.com/`, kliknij rozszerzenie → **Export**
   (tylko dla bieżącej domeny).
4. Zapisz plik jako:

   ```
   _tools/instagram-cookies.txt
   ```

> Plik zawiera aktywną sesję Twojego konta — traktuj go jak hasło.
> Nie commituj go do repozytorium (jest w `.gitignore`).
> Po zakończeniu pobierania możesz go skasować, a sesję wylogować w IG.

## Krok 2 — pobranie

```bash
python _tools/fetch-instagram.py NAZWA_PROFILU
```

Skrypt pobiera posty i rolki do `assets/instagram/NAZWA_PROFILU/`,
a na koniec wypisuje podsumowanie (ile zdjęć, ile filmów, łączny rozmiar).

## Uwagi

- Instagram ogranicza tempo zapytań; konfiguracja czeka 2–5 s między requestami.
  Przy dużym profilu pobieranie potrwa kilkanaście minut — to normalne.
- Zbyt agresywne pobieranie potrafi skutkować czasowym ograniczeniem konta.
  Jeśli zobaczysz błędy 401/429, przerwij i wróć za godzinę — archiwum
  sqlite sprawi, że nic nie pobierze się drugi raz.
- Alternatywa bez ryzyka dla konta: **Ustawienia → Centrum kont → Twoje dane →
  Pobierz informacje**. Dostajesz ZIP z mediami w oryginalnej jakości.
  Jeśli wybierzesz tę drogę, po prostu wskaż mi ścieżkę do ZIP-a.
