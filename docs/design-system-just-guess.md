# Design System — Just Guess

Dokument opisuje tokeny wizualne i reguły UI dla produktu **Just Guess** (widget overlay / ekosystem Soundie). Dla głównej aplikacji Soundie zachowaj spójność z paletą Pearl + Coral; sekcja [Overlay (OBS)](#overlay-obs--wyjątek) to wyjątek pod streamową czytelność.

## Color Palette

```css
--color-pearl: #F5F0EB;          /* tło główne */
--color-pearl-dark: #E8E0D8;     /* karty, panele */
--color-pearl-border: #D4C9BE;   /* obramowania */

--color-coral: #FF6B4A;          /* akcent główny — CTA, timery, highlights */
--color-coral-light: #FF8C6E;    /* hover states */
--color-coral-dark: #E5502F;     /* active / pressed */

--color-ink: #1A1410;            /* tekst główny */
--color-ink-muted: #6B5E54;      /* tekst drugorzędny */

--color-correct: #2ECC8A;        /* poprawna odpowiedź */
--color-wrong: #FF4466;          /* zła odpowiedź */
```

## Typography

| Użycie | Font | Charakter |
|--------|------|-----------|
| Display / nazwy akordów | **Playfair Display** lub **Fraunces** | Slab-serif, dramatyczny |
| UI / etykiety | **DM Mono** | Monospace, czytelny, techniczny |
| Treść / body | **Lato** lub **Source Sans 3** | Neutralna, czytelna |

## Overlay (OBS) — wyjątek

Nakładka musi być czytelna na dowolnym materiale z gry / streamu.

- **Tło:** `rgba(26, 20, 16, 0.85)` — ciemne, półprzezroczyste
- **Reveal akordu:** kolor coral na ciemnym tle, duża typografia Fraunces, animacja skalowania (wyróżnienie momentu odsłony)

## Aesthetic Rules

- Tło w odcieniu pearl z subtelną teksturą szumu (nakładka „grain”)
- Coral używaj oszczędnie — tylko **jeden** najważniejszy element na ekran
- Zaokrąglenia: **12px** karty, **8px** przyciski
- Cienie ciepłe, nie chłodne, np. `box-shadow: 0 4px 24px rgba(255, 107, 74, 0.12)`
- Unikaj czystej bieli (`#fff`) i czystej czerni (`#000`)
- Animacje: płynne, **300ms** `ease-out` — nic krzykliwego poza momentem ujawnienia odpowiedzi
