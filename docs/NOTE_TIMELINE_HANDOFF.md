# Note Timeline Handoff (`/teraz`)

> "nie licz chwil — zostaw ślad, że były prawdziwe"

## Cel

To **nie jest feature** — to **kręgosłup pamięci Soundie**.

Komponent na stronie `/{locale}/teraz` (pod kartą gracza) przechowuje to, co zostało po sesjach z aktywną nutą. Nie pokazuje wykresu, KPI ani osi. Pokazuje **ślady, które coś zmieniły**.

W UI nazywa się to: **"What stayed" / "Co zostało"**. W kodzie zostawiamy nazwę `NoteTimeline` ze względów technicznych.

## Filozofia (zgodna z `Soundie Userpanel Manifesto.md`)

- **Punkt ≠ sesja.** Punkt = moment, który coś zmienił.
- **Brak osi czasu jako etykiet.** Czas istnieje przestrzennie, nie liczbowo.
- **Brak KPI.** Brak streaków. Brak "performance". Total minut jest ciszą u góry, nie nagłówkiem.
- **Tooltip mówi emocjami, nie technicznymi danymi.** Bez "3 min, Apr 26". Z: archetyp + akcja intensywności + cicha afirmacja.
- **Mini-echo clustering.** 2–3 sesje blisko czasowo ⇒ jeden punkt z pełniejszym blaskiem (tak jak echa zlewają się w ciało).

---

## Gdzie to jest

- UI komponent: `components/note-timeline.tsx`
- Osadzenie: `components/note-creature.tsx` (pod główną kartą, nad `PostSessionModal`)
- Dane sesji: `trpc.soundie.getSessions` w `server/trpc/routers/soundie.ts`
- Profil emocjonalny nuty: `lib/note-healing-profiles.ts` (z `data/note-healing-profiles*.json`)
- i18n:
  - `messages/en.json` → `noteTimeline.*`
  - `messages/pl.json` → `noteTimeline.*`
- Animacja pulse: `app/globals.css` (`note-timeline-pulse-kf`, `.note-timeline-pulse`)

---

## Model punktu

Każdy widoczny punkt to **klaster** sesji ze swoim wymiarem emocjonalnym:

```ts
type ClusteredPoint = {
  id: string
  duration: number          // suma sekund w klastrze
  completedAt: Date         // newest sesja jako kotwica
  count: number             // ile sesji złożyło się na ten punkt
  intensity: 'low' | 'medium' | 'deep'
}
```

### Reguła `intensity`

```ts
if (duration < 120)  → 'low'    // dotknąłeś
if (duration < 300)  → 'medium' // zostałeś
else                 → 'deep'   // zostałeś niesiony
```

### Reguła clustering (`CLUSTER_WINDOW_MS = 10 min`)

Sesje w odstępie ≤ 10 min są spinane w jeden punkt. `duration` się sumuje, więc klaster może awansować do wyższej intensity. Dzięki temu seria krótkich powrotów świeci jak jeden głęboki moment.

---

## Mapowanie na warstwę wizualną

| Intensity | Promień (px) | Glow                    |
|-----------|--------------|-------------------------|
| `low`     | 3.5          | brak (chyba że newest)  |
| `medium`  | 6            | brak (chyba że newest)  |
| `deep`    | 9.5          | tak (subtelna aureola)  |

- **Najnowszy punkt** zawsze pulsuje (`note-timeline-pulse`).
- Starsze punkty są lekko wyblakłe (linear fade po opacity).
- Linia łącząca punkty: `curveMonotoneX`, `strokeDasharray="4 4"`, prawie niewidoczna.
- Pionowy tick "teraz" — bardzo subtelny.

---

## Tooltip — ton

Bez czasu. Bez minut. Bez liczb.

Format:

```
F — The Keeper       (font-mono, kolor nuty)
you stayed.          (font-lora, główna linia emocjonalna)
"You were held."     (font-lora italic, cicha afirmacja)
+2 returns close…    (tylko gdy klaster > 1)
```

Źródła:
- **archetype**: `getNoteHealingProfile(noteId, locale).archetype`
- **action**: `t('noteTimeline.action.{intensity}')`
- **affirmation**: `getNoteHealingProfile(noteId, locale).shortMeaning`
- **clustered hint**: `t('noteTimeline.clustered', { n })`

---

## API / propsy

```ts
<NoteTimeline
  sessions={...}        // z trpc.soundie.getSessions
  totalSeconds={...}
  noteId={activeNoteId}
  noteShort={def.short}
  noteHex={chromaHex}
  locale={'en' | 'pl'}
  className="..."
/>
```

`getSessions` zwraca:

```ts
{
  sessions: { id, duration, completedAt }[],   // do 50, malejąco
  totalCount: number,
  totalSeconds: number
}
```

Komponent przed renderem sortuje rosnąco i klastruje.

---

## Klucze i18n

```jsonc
"noteTimeline": {
  "title": "What stayed",
  "summary": "{minutes} min · {n, plural, ...}",
  "action": {
    "low":    "you came close.",
    "medium": "you stayed.",
    "deep":   "you were held."
  },
  "clustered": "+{n} returns close in time"
}
```

Tłumaczenia PL podążają tym samym tonem (np. `"deep": "zostałeś niesiony."`).

> **Ton kopii**: pasywne, miękkie, świadkujące. Bez ego użytkownika, bez "achievements".

---

## Powiązana poprawka wydajności

W `hooks/use-soundie-query.ts` usunięto round-trip `trpc.note.getByUrlKey` przy `?note=...`. Mapowanie `urlKey → noteId` idzie lokalnie przez `noteIdFromUrlKey`, więc wejście w kartę z timeline'em jest natychmiastowe.

---

## Co monitorować

- **Wąskie ekrany**: punkty `deep` mogą się dotykać przy gęstej historii — clustering to mityguje, ale przy 50+ sesjach warto będzie wprowadzić wtórny downsampling.
- **Brak danych**: komponent się nie renderuje (`sessions.length === 0`) — to celowe, by nie pokazywać pustki, gdy historia jest pusta.
- **Pierwsza sesja**: pokażemy 1 punkt z pełnym pulse — to jest w porządku, bo "ślad istnieje".
- **`shortMeaning` w polskich profilach**: literówka "cieło" w jednym z profili (`C`) — do poprawy w `data/note-healing-profiles-pl.json`.

---

## Propozycje kolejnych iteracji

1. **Echo bridge**: jeśli użytkownik ma `EchoEntry` zapisaną blisko sesji, wstaw `phrase` jako 4. linię w tooltip ("twoje słowo: …").
2. **Ślad między nutami**: cienka linia łącząca timeline'y różnych nut (na sanktuarium), gdy użytkownik wraca do tej samej nuty po dłuższej przerwie.
3. **Wstęga miesiąca**: monthly reflection letter — generujemy z `clusters` per nuta + szept profilowy.
4. **Body resonance hint**: opcjonalna mała ikona ciała (z `bodyFocus`) jako micro-element przy `deep`.

---

## Final note

> Inne dashboardy mierzą output.  
> Ten timeline odbija wewnętrzną pogodę.  
>
> Brak osi to nie pominięcie.  
> Brak osi to deklaracja.

— Miriam
