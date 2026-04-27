# Soundie — co jest zaimplementowane

Stan na podstawie obecnego kodu w repozytorium. Skrót techniczny dla developera / produktu.

## Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS 4** + komponenty **Radix** (biblioteka `components/ui/`)
- **PostgreSQL** + **Prisma 6** (`prisma/schema.prisma`, `lib/db.ts`)
- **tRPC 11** + **TanStack React Query** — API pod `/api/trpc/[trpc]`
- **next-intl 4** — i18n (PL/EN)
- **Zustand** + persystencja w przeglądarce — stan gry (nuty, sesja, gracz)
- **Zod** — walidacja wejść / wyjść tRPC
- **D3.js 7** — wykresy w panelu Sanctuary (pack layout, słupki nastrojów)
- **Vercel Analytics** (opcjonalnie w `app/providers.tsx`)

## Strony i routing

- **`/`** (domyślnie EN) i **`/pl/`** — landing z interaktywną skalą nut (`components/soundie-landing.tsx`)
- **`/play`**, **`/pl/play`** — ekran gry (`components/note-creature.tsx`, `components/locked-notes.tsx`); link do Sanctuary w nawigacji
- **`/sanctuary`**, **`/pl/sanctuary`** — **Sanctuary** (`app/[locale]/sanctuary/`, `components/sanctuary/sanctuary-dashboard.tsx`): dane `sanctuary.getDiagramData` (tRPC) — agregat czasu słuchania po emocjach nuty (`ListenSession` → `soundie` → `note.emotionId`) oraz `MoodEntry` w wybranym oknie; wizualizacje D3: `emotion-bubble-pack` (bąble wg sekund uwalniania), `mood-mosaic-bars` (paski check-inów nastroju); i18n `sanctuary.*`
- **next-intl**: `locales: ['en', 'pl']`, `defaultLocale: 'en'`, `localePrefix: 'as-needed'` (`i18n/routing.ts`)
- **Middleware** (`middleware.ts`) — integracja z `next-intl` dla ścieżek (wyłącza `api`, `_next`, pliki statyczne)

## i18n i treści w plikach

- Słowniki: **`messages/en.json`**, **`messages/pl.json`** (namespace’y: m.in. `common`, `meta`, `landing`, `noteCreature`, `returnEngine`, `moodIntelligence`, `lockedNotes`)
- **Lore w UI** (karuzela) — głównie z **`LoreFragment`** w bazie (`locale` `en` / `pl`, seed z tych samych co i18n `LORE_BY_LOCALE` w `prisma/seed.ts`); **fallback** gdy brak wierszy: `t.raw('noteCreature.lore.<nuta>')`
- **Napisy rotujące nad nutą (captions)** — w danych z bazy: `NoteCaption` z `locale: 'en' | 'pl'`, źródło seeda: **`data/note-captions-by-locale.json`**
- **Przełącznik języka** — `components/language-switcher.tsx`, nawigacja z `@/i18n/navigation`
- **Metadane** (`generateMetadata` na layoutach) — tytuły/opisy z `meta.*`, **`alternates.canonical` / `alternates.languages`** dla stron (np. `/play` vs `/pl/play`)

## Model danych (Prisma)

- **Emotion** — katalog emocji (m.in. `namePl` / `nameEn`, opisy) — używane przy nutach i kartach Teardrop
- **Note** — 12 nut chromatycznych (id takie jak w `lib/notes.ts`: `C`, `C#`, … `B`), `frequency`, `urlKey`, `chromaHex`, healing, `emotionId`, `healingStyle`, sortowanie
- **NoteCaption** — wiele wierszy na (nutę, język, `orderIndex`) — tekst nad grą
- **LoreFragment** — `body` + `orderIndex` + `locale` (unikalność na `(noteId, orderIndex, locale)`); seed: EN + PL z `LORE_BY_LOCALE`
- **Player**, **Soundie** — progres słuchania: `level`, `totalListenTime`, `loreUnlocked` per (gracz, nuta); **Player.streakNights** (kolejne dni z wizytą)
- **DailyVisit** — unikalne `(playerId, visitDate)` gdzie `visitDate` to napis `YYYY-MM-DD` (kalendarz lokalny z klienta)
- **DailyClaim** — maks. jeden wiersz na `(playerId, claimDate)`; zapis dziennej „nagrody bez wstydu”: `glowKey` (`dawn` / `dusk` / `nocturne`), `rareCaption` (najrzadszy napis z `NoteCaption` dla locale, inaczej fallback z nuty), `teardropCardId`, `noteId` (nuty, na której utworzono claim)
- **MoodEntry** — wpis przed grą: `mood` (`anxious` / `numb` / `heavy` / `scattered` / `hopeful`), `noteId` (aktywna nuta), `entryDate` `YYYY-MM-DD` (dla raportów); powiązanie z `Player` i `Note`
- **AnalyticsEvent** — zdarzenia produktowe (`first_visit`, `second_day_return`, `session_started`, `session_180_complete`, `daily_gift_revealed`, `daily_gift_listen_click`, `mood_check_in` przy zapisie `MoodEntry`, miejsca na `teardrop_open`, `share_click`) z opcjonalnym `meta` JSON; `session_started` może mieć `afterDailyGift: true`
- **ListenSession** — ukończone sesje słuchania
- **TeardropDeck** + **TeardropCard** — talia oracle (50 kart w seederze), m.in. `phase`, `phaseOrder`, `arcanaType`, powiązanie z **Emotion** (`emotionId`)
- **TeardropCardText** — pola wielojęzyczne (`tagline`, `description`, `meaning_upright`, `meaning_shadow`, `affirmation`) w `en` / `pl`
- **NoteTeardropCard** — do 5 kart Teardrop przypiętych do każdej nuty (kolejność `sortOrder`)
- **TeardropCardRelation** — model w schemacie (relacje między kartami); **nie jest wypełniany w obecnym seederze**

Zewnętrzne pliki danych pod seed:

- `data/note-captions-by-locale.json` — EN + PL (captioni nut)
- `data/teardrop-card-texts-en.json` — angielskie teksty kart (PL inline w `prisma/seed.ts`)

Polecenia: `pnpm run db:push`, `pnpm run db:seed`, `pnpm run db:setup` (push + seed).

## API (tRPC)

- **`note`** — `list`, `getById` (lore, captions z bazy, nazwa emocji wg locale), `getByUrlKey`
- **`player`** — tworzenie / identyfikacja gracza (wg potrzeb frontu)
- **`soundie`** — sesje, ukończenie sesji, progres, synchronizacja z tabelą `Soundie` (m.in. logika poziomu i odblokowanych fragmentów lore w minutach po stronie serwera, spójna z progami w routerze); przy `durationSeconds >= 180` zapis zdarzenia `session_180_complete` w `AnalyticsEvent`
- **`teardrop`** — karty z decka, wybór tekstów wg locale (`pickLocaleTexts`: dokładny język, potem EN, potem PL)
- **`returnEngine.logVisit`** — pierwsza wizyta dnia (kalendarz `YYYY-MM-DD` z klienta), nalicza `streakNights`, `first_visit` / `second_day_return` w analityce; odpowiedź: `shouldShowWelcomeBack` (tylko przy **drugim dniu kalendarzowym** użycia), szept z aktywnej nuty, `streakNights`
- **`returnEngine.revealDailyClaim`** — idempotentna mutacja: tworzy pierwsze danego dnia `DailyClaim` (deterministyczny wybór karty Teardrop do nuty + hash) lub zwraca istniejące; `isNew: true` tylko pierwszym callu dziś, wtedy analityka `daily_gift_revealed` po stronie serwera
- **`mood.saveEntry`** — zapis `MoodEntry` + rejestracja `mood_check_in` w analityce (w `meta`: `noteId`, `mood`, `entryDate`)
- **`analytics.record`** — ogólne zdarzenia z klienta (np. `session_started` przy starcie słuchania, `daily_gift_listen_click` na przycisku „Słuchaj / Listen” w module daily gift)
- **`sanctuary.getDiagramData`** — odczyt agregatów na potrzeby wykresów: `releaseByEmotion` (sekundy / minuty), `moodInRange`, `minutesToday` (z przekazanym „dniem” z klienta), `totalSecondsInRange`; wejście: `playerId`, `rangeDays`, opcjonalnie `dayStartIso` / `dayEndIso`

## Stan klienta (Zustand)

- Aktywna **nuta**, **progres** (poziom, całkowity czas słuchania, `loreUnlocked`)
- **Sesja odtwarzania** (czas trwania, elapsed; domyślna długość m.in. 300 s; przy odtwarzaniu można wymuszać sesję 180 s w kontekście “miracle”/odblokowania)
- **`playerId`** (CUID) — sync z backendem
- **Półka Teardrop** otwarta/zamknięta (`teardropShelfOpen`)
- **Daily gift (niewersjonowane w skrócie)**: `dailyGiftGlow` / `dailyGiftForNoteId` / `dailyGiftCaption` — tylko gdy bieżąca nuta zgadza się z `noteId` claimu; `pendingListenFromDailyGift` na ślad CTR po „Listen” w modalu
- **Mood (tydz. 3)**: `moodEntranceCleared` (bramka przed resztą wejścia, np. return engine) — pytanie „Jak się czujesz?”; `sessionMoodReaction` (linia reakcji mood+nuta z `lib/mood-reaction-texts.ts`); pamiątka w `sessionStorage` `moodGate:<playerId>:<YYYY-MM-DD>`, żeby w tym dniu nie wymuszać modala ponownie; „Później” tylko zamyka bramkę, bez zapisu
- **Persist** w `localStorage`, migracja ze starej wersji stanu (`note` → płaskie pole)

## Logika gry w UI (skrót)

- **Dźwięk** — odtwarzanie nuty (Web Audio, oscylator, gain, w `note-creature.tsx`)
- **Karuzela nut** zablokowanych (`locked-notes`) — tłumaczone podpisy, zasady odblokowania w oparciu o czas słuchania
- **Progres w grze (klient)** — `lib/progress.ts`: maks. poziom 5, 5 slotów na lore, progi czasu (m.in. 10 min / fragment w niektórych miejscach obliczeń w UI; serwer używa progów w **minutach** w `soundie` router)
- **„Miracle”** — po uzbieraniu **3 min (180 s)** słuchania w ramach odpowiedniej logiki: dodatkowe odblokowanie **drugiego** fragmentu lore w widoku; stała `MIRACLE_SESSION_SECONDS` w `note-creature.tsx`
- **Lore** — Karuzela (`embla`) z fragmentami z `note.getById` → `loreFragments`, w razie pustki z `next-intl`
- **Mood (tydz. 3)** — `MoodCheckInBridge` (nad `ReturnEngineBridge`): najpierw pytanie o nastrój, potem warstwa reakcji (5×12 linii w `mood-reaction-texts` EN/PL); w `note-creature` dodatkowa linia pod napisem rotującym, dopóki nuta i sesja; **Return engine** czeka na `moodEntranceCleared`
- **Return Engine (tydz. 1 + 2)** — po hydracji: `returnEngine.logVisit` + `returnEngine.revealDailyClaim` w `ReturnEngineBridge`; **modal** powitalny tylko przy wejściu w **drugi dzień kalendarzowy**; **drugi modal** (daily gift) tylko gdy `reveal` zwróci `isNew` — copy bez kasyna (`returnEngine.dailyGift`); streszczenie karty Teardrop, „rare” caption, animacja „lore dust”, wariant `glow` na kuli nuty; kolejność: welcome → potem daily gift, jeśli oba; przycisk **Listen** zamiast „claim”
- **Teardrop** — zapytanie `getMappedForNote` dla bieżącej nuty, pionowa półka, chipy z **nazwą karty** (bez numeracji), po wyborze: tagline/afirmacja z tłumaczeń tRPC; karta dnia pochodzi z tych samych mapowań (los deterministyczny w `revealDailyClaim`)

## Inne

- **Fallback** definicji nuty z `lib/notes.ts` gdy brak odpowiedzi API
- **`@vercel/analytics`** w providerach
- **`docs/`** (ten plik) — opis zaimplementowanego stanu; **`MANIFESTO.md`** w root — kierunek produktowy, osobno od tego opisu

---

*Dokument opisuje implementację, nie plan roadmap. Po zmianach w seedzie / schemacie warto uaktualnić sekcję bazy danych i danych plikowych.*
