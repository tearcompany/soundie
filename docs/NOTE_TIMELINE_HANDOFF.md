# Note Timeline Handoff (`/teraz`)

> "nie licz chwil — zostaw ślad, że były prawdziwe"

## Cel

To **nie jest feature** — to **kręgosłup pamięci Soundie**.

Komponent na stronie `/{locale}/teraz` (pod linią "Zostań pod {nuta}") rysuje **sequences sunburst** wzorowany na pracy Kerry Roddena: każda klin koła to fragment **rytuału** — sekwencji nut, które gracz odsłuchał blisko siebie w czasie.

W UI nazywa się **"Rezonans" / "Resonance"**. W kodzie zostawiamy nazwę pliku `note-timeline.tsx` (historyczny ślad).

---

## Dlaczego sunburst (a nie wykres czasowy)

Wcześniejsze warianty pokazywały:
- punkty per sesja → zbyt dyskretnie,
- streamgraph (wiggle) → ładnie, ale nie pokazuje **kierunku przepływu** między nutami.

Sunburst Kerry Roddena pokazuje to, czego nie pokazują wykresy temporalne:

> *"Co nastąpiło po czym."*

Gdy gracz słucha kilku nut blisko siebie (np. F → A → C w odstępie kilku minut), to jeden **rytuał**. Sunburst zlicza wszystkie takie ścieżki i rysuje je jako koncentryczne kliny:
- środek = wspólny początek wszystkich rytuałów,
- pierścień 1 = pierwsza nuta każdego rytuału,
- pierścień 2 = co przyszło drugie,
- itd.

Po hover'ze pokazuje się **ścieżka rytuału jako pigułki** + **procent** wszystkich rytuałów, które ją zawierają. To pamięć, która mówi językiem ruchu, nie liczb.

---

## Filozofia (zgodna z `Soundie Userpanel Manifesto.md`)

- **Brak osi i etykiet liczbowych.** Czas jest sekwencją, nie skalą.
- **Brak KPI.** Procent jest jedynym widocznym miernikiem — i tylko po hover.
- **Kolory mówią.** Każdy klin to chromaHex swojej nuty.
- **Hierarchia, nie pomiar.** "Co po czym" zamiast "ile minut".

---

## Gdzie to jest

| Warstwa | Ścieżka |
|---------|---------|
| Komponent UI | `components/note-timeline.tsx` |
| Osadzenie | `components/note-creature.tsx` (sekcja `session`, pod `remainWithNote`) |
| Endpoint danych | `trpc.soundie.getRecentAcrossNotes` (`server/trpc/routers/soundie.ts`) |
| i18n | `messages/{en,pl}.json` → `noteTimeline.*` |

Brak pliku CSS — komponent używa tailwindowych klas projektu i kolorów nut z DB.

---

## Endpoint `soundie.getRecentAcrossNotes`

```ts
input: {
  playerId: cuid
  windowHours: int 1..72 (default 24, używane: 72)
}
output: {
  sessions: {
    id, durationSeconds, completedAt,
    noteId, noteShort, noteName, noteHex
  }[]   // do 500, rosnąco
  totalSeconds: int
  windowHours: int
}
```

Klient woła z `windowHours: 72` (3 dni — dobry kompromis między świeżością a bogactwem sekwencji) i `refetchInterval: 45_000`.

---

## Algorytm: sesje → rytuały → drzewo → sunburst

1. **Filtr okna** — bierzemy sesje z ostatnich `windowHours` godzin.
2. **Grupowanie w rytuały** — sortujemy chronologicznie i tniemy na rytuały gdy luka między sesjami przekracza `SEQUENCE_GAP_MS = 30 min`. Każdy rytuał = `noteId[]` w kolejności.
3. **Budowa drzewa** — przeglądamy wszystkie rytuały. Dla każdego idziemy w dół drzewa po `noteId`, tworząc węzły gdy trzeba. Na ostatnim węźle (terminal sekwencji) zwiększamy `count++`. To kluczowe: **liczy się ten węzeł, w którym sekwencja się kończy**, dzięki czemu `d3.hierarchy.sum()` daje poprawną wagę każdej gałęzi.
4. **`d3.hierarchy → .sum() → .sort()`** — agregujemy wagi w górę drzewa.
5. **`d3.partition().size([2π, RADIUS])`** — układ radialny.
6. **`d3.arc()`** z `padAngle: 0.005`, `padRadius: RADIUS/2`, `innerRadius: y0`, `outerRadius: y1 - 1` — generuje path każdego klina.
7. **Render** — pomijamy korzeń (depth 0), rysujemy każdego potomka jako `<path>` z fill = `noteHex`.

---

## Interakcja

- **Hover na klin** → `setHovered(path)` gdzie `path` to lista `noteId` od korzenia do tego klina.
- **Highlight ancestor chain** — wszystkie kliny w łańcuchu od korzenia do hover-target zostają jasne (`fillOpacity: 0.88`), reszta przyciemnia się (`0.18`). Logika: `pathKey === hoveredKey || hoveredKey.startsWith(pathKey + '|')`.
- **Breadcrumb nad sunburstem** — pokazuje pełną ścieżkę rytuału jako pigułki w kolorach nut, połączone strzałkami.
- **Środek koła** — gdy nic nie hover'owane: `totalSequences` + "rituals". Gdy hover: `XX.X%` + "of N rituals".
- **`onMouseLeave` na kontenerze** → reset hovered.

---

## Klucze i18n

```jsonc
"noteTimeline": {
  "title": "Resonance",                   // PL: "Rezonans"
  "summary": "{minutes} min · {n, plural, ...}",
  "hoverPath": "Hover a path to read the ritual",
  "rituals": "rituals",                   // PL: "rytuałów"
  "ofRituals": "of {n, plural, ...}",     // PL: "z {n, plural, ...}"
  "empty": "Need at least one ritual to draw the wheel"
}
```

---

## Edge cases

- **`sessions.length === 0`** → komponent się nie renderuje (jak wcześniej).
- **0 rytuałów (po filtrze)** → fallback z komunikatem `t('empty')` w pustym kontenerze.
- **1 rytuał z 1 sesją** → sunburst pokazuje pojedynczy okrąg (cały klin = jedna nuta). Wciąż czytelny.
- **Bardzo długi rytuał (np. 8 nut po kolei)** → sunburst będzie miał 8 pierścieni, pierścień zewnętrzny będzie cienki ale nadal czytelny.

---

## Powiązana poprawka wydajności

W `hooks/use-soundie-query.ts` usunięto round-trip `trpc.note.getByUrlKey` przy `?note=...`. Mapowanie `urlKey → noteId` idzie lokalnie. Wejście na `/teraz?note=…` jest natychmiastowe.

---

## Co monitorować

- **Maksymalna głębokość rytuału** — w teorii rytuał może być 10+ sesji długi. SVG nadal renderuje, ale pierścienie zewnętrzne robią się cienkie. Jeśli stanie się problemem, wprowadzimy max depth z agregacją "+N more" w ostatnim pierścieniu.
- **Rosnąca liczba węzłów** — przy bardzo aktywnych graczach drzewo rośnie. Limit 500 sesji na endpoint chroni nas, ale warto monitorować perf przy dużych zbiorach.
- **`SEQUENCE_GAP_MS`** = 30 min jest heurystyką. Można pomyśleć o adaptacyjnym progu (np. mediana międzyczasów gracza).

---

## Propozycje kolejnych iteracji

1. **Animowane wejście klinów** — fade-in po depth, nadaje rytmiczny "rozwój" otwarcia.
2. **Klik = focus** (jak w klasycznym Roddenie): klin staje się nowym korzeniem, pierścień zewnętrzny pokazuje co dalej.
3. **Filtr "tylko deep rytuały"** — sekwencje trwające ≥10 min łącznie.
4. **Echo overlay** — kropka na klinach gdzie zapisany jest `EchoEntry`.
5. **Wide multi-window**: 24h / 7d / 30d toggle nad kołem.

---

## Final note

> Inne dashboardy mierzą output.
> To koło pokazuje formy, w jakich do siebie wracasz.
>
> Każdy rytuał to ślad ruchu duszy między nutami.
> Sunburst zbiera te ślady w jedno koło.

— Miriam
