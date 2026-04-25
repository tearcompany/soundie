# Soundie — dokumentacja obecnej implementacji

Dokument opisuje **stan faktyczny** kodu w repozytorium: architekturę, przepływ danych, katalog nut, audio, routing i główne pliki. Wizja produktu i roadmapa pozostają w [README.md](../README.md).

---

## 1. Stos i uruchomienie

| Warstwa | Użycie |
|--------|--------|
| **Next.js** (App Router) | `app/page.tsx`, layout, trasy |
| **React 19** | komponenty klienckie (`'use client'`) |
| **TypeScript** | typy w `lib/`, komponentach |
| **Tailwind CSS v4** | style w klasach, tokeny w `app/globals.css` |
| **Zustand** + **persist** | stan gry, `localStorage` (`soundie-storage`) |
| **Zod** | schematy w `lib/soundie-store.ts` (walidacja kształtu stanu) |
| **Embla** (przez shadcn `Carousel`) | przewijana lista 12 nut |
| **Web Audio API** | generowanie tonu (oscylator), gain, reverb (convolver) |

Pakiety: `pnpm` (lockfile `pnpm-lock.yaml`).

---

## 2. Trasy i ekrany

| Ścieżka | Rola |
|---------|------|
| [`/`](../app/page.tsx) | Landing: marka **Soundie**, **Presence Pass**, CTA do gry ([`components/soundie-landing.tsx`](../components/soundie-landing.tsx)). |
| [`/play`](../app/play/page.tsx) | Gra: nuta, audio, lore, karuzela (dawny ekran główny). Metadane: `app/play/layout.tsx`. |

```
app/play/page.tsx
├── NoteCreature        — główna „żywa” nuta, Web Audio, panel lore
├── SoundieQueryBridge  — tylko synchronizacja `?note=` → Zustand
└── LockedNotes         — karuzela 12 nut, wybór nuty + URL
```

- **`/play`**: `main` w układzie kolumnowym flex (`min-h-dvh`), pierwszy blok (`flex-1`, `min-h-0`) owija `NoteCreature`, pod spodem w `<Suspense>`: bridge + karuzela (wymuszone przez `useSearchParams` w Next).
- Główne tło: `bg-pearl` (design w README / globals).

---

## 3. Katalog nut — [`lib/notes.ts`](../lib/notes.ts)

- **12 wpisów** w stałej kolejności (m.in. C, C♯, D, …, B), każdy typu `NoteEntry`:
  - `id` — wewnętrzny identyfikator (np. `C#` jako string);
  - `short`, `name` (nazwa angielska „kreatury”);
  - `frequency` (Hz) — w praktyce odpowiada oktawie wokół wspólnego doświadczenia (nuta centralna w gamie);
  - `urlKey` — bezpieczny dla URL fragment (np. `C#` → `Cs` — w query nie używa się `#[...]`);
  - `locked` — flaga (na przyszłość; w UI wszystkie nuty są w karuzeli);
  - `healing` — krótki opis właściwości (ang.);
  - **`chromaHex`** — kolor synestetyczny (HEX) używany w UI;
  - **`synestheticTitlePl`**, **`synestheticLinePl`** — tytuł i pierwsze zdanie lore (PL);
  - **`element`** — etykieta „żywiołu” (PL).

Eksportowane funkcje pomocnicze: `getNoteById`, `isValidNoteId`, `noteIdFromUrlKey`, `urlKeyForNoteId`, `getLoreFragmentsForNote`, `getSynestheticChroma`, tablica `NOTE_LIST`.

**Lore (5 fragmentów):** pierwszy fragment to zawsze napis złożony z `(Hz) {synestheticTitlePl} — {zdanie}`. Dla **C** kolejne cztery to dawna treść edukacyjna (ang.); dla **pozostałych nut** — uzupełnienia placeholder. Mechanizm odblokowywania nadal opiera się na `progress.loreUnlocked` w store (pętla 0–4 indeksu fragmentu w UI z zabezpieczeniem do zakresu tablicy).

---

## 4. Stan — [`lib/soundie-store.ts`](../lib/soundie-store.ts)

Zustand z **persist** (`name: 'soundie-storage'`, `version: 2`).

**Przechowywany stan (bez funkcji w JSON):**

| Pole | Znaczenie |
|------|-----------|
| `activeNoteId` | Identyfikator wybranej nuty (musi wystąpić w katalogu). |
| `progress` | `level` (1–5), `totalListenTime` (s), `loreUnlocked` (0–5), `lastSeen` (ISO). Progres **globalny** (nie per nuta w pierwszej wersji). |
| `currentSession` | Sesja słuchania: `active`, `startedAt`, `duration` (domyślnie 180 s), `elapsed`. |

**Akcje (skrót):** `startSession`, `stopSession`, `updateSessionElapsed`, `completeSession` (dopisuje czas, liczy level co 600 s, lore co 900 s w obecnej logice), `unlockLore`, `setActiveNote`, `reset`.

**Migracja v1 → v2:** stary kształt z polami `note: { id, level, ... }` jest mapowany na `activeNoteId` + `progress` (funkcja `migrate` w `persist`).

---

## 5. Routing i wybór nuty — [`hooks/use-soundie-query.ts`](../hooks/use-soundie-query.ts)

- **Query:** `?note={urlKey}` (np. `?note=Cs` dla C♯).  
- **`useSoundieUrlToStore`** (używane wyłącznie w [`components/soundie-query-bridge.tsx`](../components/soundie-query-bridge.tsx)): po stronie klienta, gdy w URL jest `note`, ustawia `activeNoteId` w Zustand — **ŹRÓDŁO** przy otworzeniu / zmianie linku.
- **`useNoteSelection`**: `activeNoteId` + `setNote(id)` — `setActiveNote` + `router.replace` z zaktualizowanym parametrem (bez przewijania strony). Używane w karuzeli nut.

Cel: udostępnialne linki (np. konkretna nuta) i jedno źródło prawdy: URL steruje sklepem przy nawigacji, interakcja w UI aktualizuje URL.

---

## 6. Dźwięk — [`components/note-creature.tsx`](../components/note-creature.tsx)

- **AudioContext** tworzony lazy w `useEffect` (kontekst w ref).
- Odtwarzanie: `OscillatorNode` (typ `sine`), `frequency` z **`getNoteById(activeNoteId).frequency`**, podłączenie przez `ConvolverNode` (impuls „reverb”) do `GainNode` → `destination`.
- Zmiana nuty przy włączonym dźwięku: `oscillator.frequency.setValueAtTime` w reakcji na zmianę częstotliwości aktywnej nuty.
- Zatrzymanie: rampa gain, `osc.stop()`.
- Pasek sesji i uzupełnianie czasu przez `setInterval` + `updateSessionElapsed` / `completeSession` / `stopSession` przy ukończeniu czasu.

**Grafika:** sylwetka diamentu (path SVG w `viewBox` 0–0–200), gradient wypełnienia i rozmycia oparte o **`chromaHex`** bieżącej nuty; pomocniczo [`lib/hex-rgba.ts`](../lib/hex-rgba.ts) (`hexToRgba` dla cieni i aury).

**Panel lore:** tytuł, częstotliwość, healing, wyróżniony blok lore z lewym obramowaniem w kolorze nuty, licznik odblokowanych fragmentów.

---

## 7. Karuzela — [`components/locked-notes.tsx`](../components/locked-notes.tsx)

- Spis z [`NOTE_LIST`](../lib/notes.ts): etykieta, Hz, gemo-diament, kolory z `chromaHex` (słabiej gdy nie wybrano, pełna gama przy wyborze / hover).
- **Nie** `position: fixed` — sekcja jest **na końcu** layoutu w `main` (stopka w przepływie strony).
- Przyciski nawigacji: `variant="ghost"` (bez ramek outline), Embla: `align: 'start'`, `dragFree: true`, slajdy `basis-1/3` (3 nuty w widoku).

Kolejność w kafelku: najpierw **symbol + Hz**, pod nimi **diament**.

---

## 8. Layout i `Suspense`

Komponenty korzystające z `useSearchParams` muszą leżeć pod drzewem `<Suspense>` (wymaganie React/Next) — w `page.tsx` `SoundieQueryBridge` i `LockedNotes` są owinięte w wspólny `Suspense`.

---

## 9. Powiązane dokumenty

- [Design system (Just Guess)](./design-system-just-guess.md) — tokeny koloru / typografia dla spójnego Ekosystemu; Soundie używa m.in. pearlu i kolorów nut z `chromaHex`.

---

## 10. Co planowo poza tą implementacją (skrót)

- Backend (tRPC, Prisma, użytkownicy) — w README, **nie** w obecnym kodzie.
- Pełna mapa **88 klawiszy** (oktawy, jasności barwy) — obecnie jedna tabela 12 nut z jednym `frequency` / nutę.
- Testy automatyczne — brak w projekcie.

---

*Ostatnia synchronizacja z opisem: implementacja frontu (stan, katalog, audio, URL, UI).*
