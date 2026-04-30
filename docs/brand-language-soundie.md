# Soundie — Product Language (manifest semantyczny)

Ten dokument nie jest „stylistyką”. To **ontologia copy**: jak Soundie nazywa rzeczywistość użytkownika i produktu.

Czytaj go przy: UI copy, `messages/*.json`, onboarding, analityce nazwanej dla ludzi, dokumentacji widocznej dla gracza.

---

## Czym Soundie nie jest

Soundie nie jest aplikacją produktywności, siłownią ani grą o punkty.

Soundie jest **towarzyszem emocji w medytacyjnym słuchaniu** — opartym o **żywe nuty** (częstotliwości), obecność i powolne odsłanianie.

---

## Ton

- Ciepły, mało słów.
- **Sacred minimalism** — cisza Project, nie pustka marketingu.
- Emocjonalna inteligencja, nie coachowanie.
- Nigdy korporacyjnie, nigdy „hustle”.

---

## Zasady tłumaczeń (twarda lista)

**Unikaj** języka siłowni, grywalizacji, SaaS i Duolinga:

- streak, grind, points, reward, level up (jako chwalenie „progresu”)
- „osiągnięcia” w sensie gamifikacji
- tablicy wyników, rankingu, challenge (w sensie presji)

**Preferuj** warstwę symboli i ciała:

| Unikaj (płasko) | Preferuj (Soundie) |
|-----------------|----------------------|
| streak | noce powrotu / rytm powrotu |
| session (sucho) | rytuał słuchania / sesja w rezonansie |
| minutes (licznik) | czas w rezonansie / czas przy dźwięku |
| progress (dashboard) | odsłanianie / dojrzewanie |
| unlock | odsłonięcie / ujawnienie |
| stats | podróż / ślad (kontekst: Sanktuarium) |
| daily check-in (chłodno) | puls dnia / obecność przy progu |
| playlist | ścieżka / droga (np. Teardrop) |
| today (jako feature) | rytm dnia / dziś (jako wezwanie, nie kalendarz biura) |

**Nigdy** jednym słowem „streak” w copy użytkownika (PL/EN) bez interpretacji — zawsze w **ramie powrotu do siebie / do Soundie**, nie „łańcucha logowania”.

---

## Nuty to byty (nie suwaki)

Nazwy architektoniczne są **właściwymi imionami** interfejsu emocji, np.:

- C — The Foundation  
- F — The Keeper  
- F# — The Mirror  

W zdaniach używaj tych tożsamości tam, gdzie naturalnie brzmią — nie skracaj do „nuty C”, jeśli kontekst pozwala na „The Foundation” / lokalny odpowiednik poetycki.

---

## Przykłady etykiet

**Źle:** 5 day streak  
**Dobrze:** 5 nights of return  

**Źle:** Your progress  
**Dobrze:** What’s unfolding / Your unfolding (kontekst zależny)

**Źle:** Stats  
**Dobrze:** Your journey (w Echo / Sanktuarium)

**Źle:** Daily reward  
**Dobrze:** What formed overnight / dzisiejsze odsłonięcie (zgodnie z ekranem)

---

## Naming engine — przy tłumaczeniach

**Jeśli dosłowne słowo istnieje, ale brzmi płasko albo „startupowo”** — nie tłumacz słowo w słowo. **Przenieś znaczenie przez świat Soundie:**

1. Jaki **somatyczny** lub **rytualny** obraz pasuje? (noc, oddech, powrót, warstwa, droga)  
2. Czy zdanie może być **krótsze** i **cieplejsze** o jeden stopień?  
3. Czy usunięcie licznika / żargonu poprawia **obecność** tekstu?

Strukturalne klucze i18n (`today.streak`) mogą zostać — **wartość** powinna realizować ten manifest (patrz `docs/SOUNDIE_COPY_GLOSSARY.json`).

---

## Powiązane pliki

- `docs/SOUNDIE_COPY_GLOSSARY.json` — preferowane etykiety i zakazane namiary dla AI/humanów  
- `.cursor/rules/soundie-brand-language.mdc` — reguła Cursor (sesja)

---

## Jedno zdanie

Nie seedujemy tylko stringów — seedujemy **sposób myślenia o świecie produktu**. Copy bez ontologii zawsze wygląda jak przypadkowy JSON.
