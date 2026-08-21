#!/usr/bin/env python
"""
Pobiera zdjęcia i filmy z profilu na Instagramie do assets/instagram/.

Użycie:
    python _tools/fetch-instagram.py NAZWA_PROFILU

Wymaga pliku _tools/instagram-cookies.txt z aktywną sesją —
szczegóły w _tools/README-instagram.md.
"""
import os
import subprocess
import sys

# konsola Windows domyślnie używa cp1250 — wymuszamy UTF-8, żeby polskie znaki
# nie zamieniały się w krzaki
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONF = os.path.join(ROOT, "_tools", "gallery-dl.conf")
COOKIES = os.path.join(ROOT, "_tools", "instagram-cookies.txt")
OUT = os.path.join(ROOT, "assets", "instagram")

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic"}
VIDEO_EXT = {".mp4", ".mov", ".webm"}


def human(n):
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def summarize(path):
    images = videos = other = 0
    total = 0
    for dirpath, _, files in os.walk(path):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            size = os.path.getsize(os.path.join(dirpath, f))
            total += size
            if ext in IMAGE_EXT:
                images += 1
            elif ext in VIDEO_EXT:
                videos += 1
            else:
                other += 1
    return images, videos, other, total


def main():
    if len(sys.argv) < 2:
        sys.exit("Podaj nazwę profilu, np.:  python _tools/fetch-instagram.py zaklad_fryzjerski")

    user = sys.argv[1].strip().strip("/").split("/")[-1].lstrip("@")

    if not os.path.exists(COOKIES):
        sys.exit(
            "Brak pliku z ciasteczkami:\n  " + COOKIES +
            "\n\nInstagram nie udostępnia mediów bez zalogowanej sesji."
            "\nInstrukcja eksportu: _tools/README-instagram.md"
        )

    url = f"https://www.instagram.com/{user}/"
    print(f"Pobieram: {url}\nDocelowo: {OUT}\n")

    before = summarize(OUT) if os.path.isdir(OUT) else (0, 0, 0, 0)

    cmd = [sys.executable, "-m", "gallery_dl", "--config", CONF, url]
    code = subprocess.call(cmd, cwd=ROOT)

    after = summarize(OUT) if os.path.isdir(OUT) else (0, 0, 0, 0)

    print("\n" + "-" * 52)
    print(f"Zdjęcia:  {after[0]:5}  (+{after[0] - before[0]})")
    print(f"Filmy:    {after[1]:5}  (+{after[1] - before[1]})")
    if after[2]:
        print(f"Inne:     {after[2]:5}")
    print(f"Rozmiar:  {human(after[3])}")
    print("-" * 52)

    if code != 0:
        print(
            "\ngallery-dl zakończył się kodem " + str(code) +
            ".\nJeśli to 401/429 — Instagram ogranicza tempo. Odczekaj godzinę"
            "\ni uruchom ponownie; archiwum sqlite pominie już pobrane pliki."
        )
    return code


if __name__ == "__main__":
    sys.exit(main())
