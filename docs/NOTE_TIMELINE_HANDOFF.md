# Note Timeline Handoff (`/teraz`)

> "nie licz chwil — zostaw ślad, że były prawdziwe"

## Cel

Komponent pod sekcją sesji na `/{locale}/teraz` renderuje **streamgraph z `d3.stackOffsetWiggle`**.  
To nie jest wykres BI, tylko „fala rezonansu”: jak nuty przejmują prowadzenie w czasie.

---

## Dlaczego `stackOffsetWiggle`

- daje organiczny przepływ warstw bez twardego baseline,
- dobrze znosi krótkie i nieregularne sesje (brak „ząbków” osiowych),
- komunikuje zmianę dominującej nuty przez kształt i kolor fali.

W praktyce: **rzeka, nie tabela**.

---

## Gdzie to jest

| Warstwa | Ścieżka |
|---------|---------|
| UI | `components/note-timeline.tsx` |
| Osadzenie | `components/note-creature.tsx` (sekcja `session`) |
| Dane | `trpc.soundie.getRecentAcrossNotes` (`server/trpc/routers/soundie.ts`) |
| i18n | `messages/{en,pl}.json` → `noteTimeline.*` |

---

## Algorytm

### 1) Okno czasu

`domainStart = now - windowMs`, gdzie:
- bazowo `windowHours` (24h),
- dynamiczny zoom do min. 3h przy dłuższej aktywnej sesji.

### 2) Buckety

Okno dzielimy na stałą liczbę bucketów (`BUCKETS = 46`), a każdą sesję dokładamy do bucketu:
- klucz: `noteId`,
- wartość: minuty słuchania.

### 3) Stack wiggle

```ts
d3.stack<BucketRow>()
  .keys(noteIds)
  .value((d, key) => d[key] ?? 0)
  .offset(d3.stackOffsetWiggle)
  .order(d3.stackOrderNone)
```

### 4) Area

```ts
d3.area()
  .x((d) => x(bucketIndex))
  .y0((d) => y(d[0]))
  .y1((d) => y(d[1]))
  .curve(d3.curveBasis)
```

### 5) Live transitions

Przy rekalkulacji (co ~12s) pathy dostają transition na `d`:

```ts
select(pathEl).transition().duration(1000).attr('d', nextD)
```

Bez skoków, bez restartu komponentu.

### 6) Dominanta emocji (nagłówek)

Nad wykresem pokazujemy emocję dominującą w bieżącym oknie:
- sumowanie czasu słuchania per nuta,
- `computePulseDistribution` (wagi `emotionTreats`),
- wybór najwyższego score.

---

## Interakcja

- hover na segment (przez przezroczyste hit-rect) pokazuje:
  - `noteShort · noteName`,
  - minuty segmentu.
- brak procentów, rankingów i osi liczbowej.

---

## Roadmap: AI real-time note transitions (translation)

Docelowo warstwa AI może opisywać „co się przesuwa” między nutami (PL/EN), ale to osobny etap.

| Aspekt | Notatka |
|--------|--------|
| Kiedy | podczas słuchania / przy zmianie nuty |
| Wejście | para/łańcuch nut, Hz, opcjonalnie mood |
| Wyjście | krótkie copy zgodne z `MANIFESTO.md` i `brand-language-soundie.md` |
| Status | dokumentacja / roadmap |

---

## Final note

> Nie chodzi o to, by udowodnić wynik.  
> Chodzi o to, by zobaczyć, że fala naprawdę płynęła.
