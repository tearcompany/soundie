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

Po hover'ze pokazuje się **ścieżka rytuału jako lista nut** (bez liczników statystycznych — cel: sama geografia ruchu). To pamięć, która mówi językiem ruchu, nie liczb.

---

## Filozofia (zgodna z `Soundie Userpanel Manifesto.md`)

- **Brak osi i etykiet liczbowych na wykresie.** Czas jest sekwencją, nie skalą.
- **Bez KPI w tooltipie** — kolory i kolejność nut wystarczają; agregaty zostają w Sanktuarium / roadmapie analitycznej.
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

## Algorytm: sesje → sekwencje → drzewo → sunburst

Implementacja: `collectRitualSequences` + `buildTree` w `components/note-timeline.tsx`.

### 1. Filtr okna czasu

Bierzemy sesje mieszczące się w `domainStart = nowMs - windowMs`, gdzie `windowMs` jest dynamiczne: zaczyna od `windowHours` (domyślnie 24h) i zawęża się do minimum **3h** proporcjonalnie do czasu aktywnej sesji (pełny zoom po ~45 min słuchania).

### 2. Grupowanie w sekwencje (journey)

Sortujemy sesje rosnąco po `completedAt`. Tniemy na nową sekwencję gdy luka między sesjami przekracza `RITUAL_GAP_MS = 40 min`. Każda sekwencja to `noteShort[]` w kolejności odtwarzania.

**Deduplicacja sąsiadów:** jeśli ta sama nuta pojawia się kolejno (np. dwa odsłuchy tej samej nuty pod rząd), wchodzi do sekwencji **tylko raz** — liczy się zmiana, nie powtórzenie.

### 3. Zliczanie sekwencji

Każda sekwencja jest spłaszczana do klucza (`A>F>C`). Tworzymy `Map<klucz, count>`.

### 4. Budowa drzewa

Dla każdego wpisu z mapy przechodzimy po częściach klucza (`A`, `F`, `C`, …) tworząc węzły gdy brakuje. Na węźle końcowym dodajemy `value += count`. `value` jest **tylko na liściach** — to kluczowe, bo `d3.hierarchy.sum()` propaguje sumy w górę i każdy pośredni węzeł dostaje sumę swoich potomków.

### 5. Layout radialny D3

```
d3.hierarchy(tree).sum(d => d.value ?? 0).sort(desc)
→ d3.partition().size([2π, r])
→ d3.arc()
    .innerRadius(d => d.y0 + BASE_RADIUS)
    .outerRadius(d => max(d.y0 + BASE_RADIUS + 1, d.y1 + BASE_RADIUS - 1))
```

`BASE_RADIUS = 18px` — promień martwej strefy centrum (minuty / Hz).

### 6. Render

- Pomijamy korzeń (`depth === 0`) i kliny o zerowej rozpiętości kątowej.
- Każdy klin `<path>` dostaje `fill = chromaHex` swojej nuty, z `opacity 0.92` gdy to aktywna nuta, `0.72` w pozostałych.
- Aktywna nuta ma `drop-shadow` glow w swoim kolorze.

### 7. Neurofeedback (live RAF 60fps)

Dwa pierścienie `<circle ref>` wokół sunburstu są animowane bezpośrednio przez DOM (`ring1Ref`, `ring2Ref`) bez `setState`. Centrum (`centerNumRef`, `centerLblRef`) pokazuje:
- podczas sesji: `{Hz} · {noteShort}` z pulsem oddechowym skalowanym od `frequencyHz`,
- w spoczynku: `{totalMinutes}` + `min`.

---

- **Hover na klin** → tooltip z **samą ścieżką nut** (np. `A → F`), kolorem segmentu; bez liczników powrotów / procentów (świadoma redukcja szumu analitycznego).
- **Środek koła** — minuty w rezonansie lub live Hz w trakcie odtwarzania (neurofeedback); nie breadcrumb z procentami.

---

## Roadmap: AI real-time note transitions (translation)

**Założenie:** osobny warstwa narracji generowana przez **AI**, która w **czasie rzeczywistym** *tłumaczy* i *nazywa* **przejścia (transitions / shifting) między nutami**: co się zmienia w doświadczeniu, gdy słuch przechodzi z jednej częstotliwości / architype’u na drugi — w języku użytkownika, w ramie Soundie (ciepło, minimalizm, bez tonu „dashboardu”).

| Aspekt | Notatka |
|--------|--------|
| **Kiedy** | Podczas słuchania (zmiana nuty, faza dual rytuału), ewentualnie po hoverze na gałęzi sunburstu jako uzupełnienie samej listy nut |
| **Wejście** | Para / łańcuch nut, Hz, opcjonalnie mood przy progu, kontekst sesji |
| **Wyjście** | Krótki blok copy (PL/EN); wymaga **review** wobec [`brand-language-soundie.md`](./brand-language-soundie.md) i [`MANIFESTO.md`](../MANIFESTO.md) |
| **Status** | Tylko dokumentacja / roadmap — brak wdrożenia w tym commicie |

Szerszy kontekst produktowy: [ROADMAP.md — *Roadmap: AI real-time note transitions (translation)*](./ROADMAP.md#roadmap-ai-real-time-note-transitions-translation).

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
