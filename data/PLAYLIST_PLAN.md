# System Playlist — architektura, stan i kierunki

> Dokument opisuje aktualny stan (kwiecień 2026): model danych, API, frontend,
> powiązania z planem tygodnia / misją tygodnia oraz co z tego systemu wyrasta.

---

## 1. Idea produktowa

Playlista nie jest listą odtwarzania.
Jest **nośnikiem rytmu praktyki** użytkownika.

Trzy warstwy:

| Warstwa | Co robi |
|---|---|
| **Organizacja** | Ulubione, Na później, własne listy tematyczne |
| **Nawyk** | Plan tygodnia — konkretna playlista na konkretny dzień |
| **Wzrost** | Publiczny link — playlista wychodzi poza mur logowania |

---

## 2. Model danych

### Tabela `playlist`

| Kolumna | Typ | Uwagi |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `user`, CASCADE |
| `name` | varchar | |
| `description` | varchar, nullable | |
| `type` | enum | `custom` \| `favorites` \| `watch_later` |
| `is_private` | bool | domyślnie `true` |
| `is_published` | bool | domyślnie `false`; tylko `custom` |
| `public_slug` | varchar(160), nullable | unikalny partial index (gdy NOT NULL) |
| `public_view_count` | int | domyślnie 0 |
| `last_played_item_id` | UUID, nullable | FK → `playlist_item` (SET NULL) |

**Constraints:** jedna `favorites` i jedna `watch_later` na użytkownika (`UQ_playlist_user_system`).

### Tabela `playlist_item`

| Kolumna | Typ | Uwagi |
|---|---|---|
| `playlist_id` | UUID | FK → `playlist`, CASCADE |
| `content_type` | enum | `session` \| `challenge` \| `meditation` \| `challenge_session` |
| `content_id` | UUID | |
| `order_index` | int | |
| `progress_seconds` | int | zapamiętany postęp w sekundach |

Unikalność: `(playlist_id, content_type, content_id)` — ta sama treść może być tylko raz na liście.

### Tabela `playlist_rating`

Ocena 1–5 per użytkownik per playlista (tylko opublikowane, nie właściciel).

### Powiązania poza modułem

```
weekly_plan_slot.playlist_id  →  playlist (SET NULL)
user_activity.source_playlist_id  →  playlist (SET NULL)
```

`source_playlist_id` to klucz do liczenia **misji tygodnia** — tylko ukończenia z kontekstem playlisty wchodzą do minutnika.

---

## 3. Typy playlist

### Systemowe (tworzone lazy przy pierwszym wejściu)

- **`favorites`** — „Ulubione"
- **`watch_later`** — „Do zrobienia później"

Systemowe playlisty: nie można zmienić nazwy/opisu, nie można publikować, nie można usuwać.
Można: dodawać/usuwać/reorder elementy, zmieniać `is_private`.

### Custom

Tworzone przez użytkownika. Tylko `custom` obsługuje:
- edycję nazwy i opisu
- `is_published` → wejście w Odkrywaj
- `public_slug` → publiczny link `/p/:slug`
- usuwanie

---

## 4. Backend — API

### Endpointy chronione JWT (`public/playlists/*`)

```
GET    /                          → lista wszystkich playlist użytkownika
GET    /:id                       → jedna playlista użytkownika
GET    /:id/items                 → elementy (własność wymagana)
POST   /                          → utwórz custom
PATCH  /:id                       → edytuj (ograniczenia typów)
DELETE /:id                       → usuń custom

POST   /:id/items                 → dodaj element
DELETE /:id/items/:itemId         → usuń element
PUT    /:id/items/reorder         → zmień kolejność
PATCH  /:id/playback              → zapisz lastPlayedItemId
PATCH  /:id/items/:itemId/progress → zapisz postęp w sekundach

GET    published                  → Odkrywaj (skip/take)
GET    published/:id              → szczegół opublikowanej
GET    published/:id/items        → elementy opublikowanej
GET    published/:id/my-rating    → moja ocena
POST   published/:id/rate         → oceń (1–5, nie właściciel)
```

### Endpointy publiczne bez JWT (`public/playlist-share/*`)

```
GET    :slug                      → landing strony /p/:slug
POST   track/:slug                → inkrementuj public_view_count (204)
```

---

## 5. Logika serwisu — ważne zachowania

### Auto-slug przy publikacji

Gdy `custom` playlista jest **published bez `publicSlug`** — backend automatycznie
generuje slug z nazwy (transliteracja PL → ASCII, kebab-case, unikalność przez suffix).
Dzieje się to w `getMany`, `getOneForUser` i `update`.

### Walidacja własności

- `getItems` / `setPlayback` / `setItemProgress` — tylko własna playlista
- `WeeklyPlanService.put` — slot musi wskazywać własną playlistę
- `addItem` — treść musi być opublikowana w odpowiedniej encji (sesja/wyzwanie)
- `assertUserOwnsPlaylist` przy zapisie `source_playlist_id` do aktywności

### Odtwarzanie z kontekstem

URL sesji przyjmuje `?pl={playlistId}&plIdx={index}`.
Panel boczny sesji wczytuje listę `getItems` i pokazuje kontekst playlisty.
Po ukończeniu sesji backend dostaje `playlistId` → ustawia `source_playlist_id` tylko gdy własność OK.

---

## 6. Frontend — widoki i trasy

### Trasy w `App.tsx`

| Trasa | Guard | Komponent |
|---|---|---|
| `/me/practice/lists` | Protected + subscription | `UserPlaylistsSection` |
| `/me/practice/favorites` | Protected + subscription | `SystemPlaylistAccordion(favorites)` |
| `/me/practice/watch-later` | Protected + subscription | `SystemPlaylistAccordion(watch_later)` |
| `/me/practice/weekly` | Protected + subscription | `WeeklyPlanTab` |
| `/me/practice/summary` | Protected + subscription | `Summary` (hero + misja + rekomendacje) |
| `/discover/playlists` | Protected + subscription | `DiscoverPlaylists` |
| `/discover/playlists/:id` | Protected + subscription | `DiscoverPlaylistDetail` |
| `/play/playlist/:playlistId` | Protected + subscription | `PlayPlaylist` |
| `/p/:slug` | **PublicRoute** — bez JWT | `PublicPlaylistLanding` |

### Kluczowe widoki

**`UserPlaylistsSection`**
- Lista tylko `custom` playlist
- Tworzenie, edycja nazwy/opisu, publikacja, kopiowanie linku `/p/{slug}`
- Rozwijane karty z listą elementów, reorder (DnD), odtwarzanie od początku

**`SystemPlaylistAccordion`**
- `favorites` i `watch_later` — lazy load itemów
- Usuwanie pozycji, bez edycji metadanych playlisty

**`WeeklyPlanTab`**
- Selektor playlisty na każdy dzień 0–6
- Pobiera własne playlisty użytkownika (w tym systemowe)

**`DiscoverPlaylists` / `DiscoverPlaylistDetail`**
- Opublikowane playlisty innych użytkowników
- Ocenianie, podgląd elementów (tylko do czytania)

**`PublicPlaylistLanding`** (`/p/:slug`)
- Hero z nazwą, liczbą sesji, minutami, autorem
- Lista pozycji z okładkami i czasem
- CTA: zalogowany → `/play/playlist/:id`; gość → `/login` + link „Dołącz"
- Ustawia `document.title` + meta OG dla sheerowania

**`HomePracticePromo`** (strona główna)
- Plan tygodnia: linki do zaplanowanych playlist danego dnia
- Moje playlisty: skróty + 3 karty z Odkrywaj

---

## 7. Plan tygodnia i misja — powiązanie

```
WeeklyPlanSlot
  └─ playlist_id  →  Playlista użytkownika (własna)

UserActivity (ukończona sesja)
  └─ source_playlist_id  →  ta sama playlista własna (walidowane przy zapisie)

WeeklyMission
  └─ minutes_on_mat  =  SUM(session.duration WHERE source_playlist_id IS NOT NULL)
  └─ streak_weeks    =  liczba kolejnych tygodni z min. jednym ukończeniem z playlisty
```

**Ważne ograniczenie:** misja tygodnia zlicza **wyłącznie** praktykę z własnych playlist użytkownika. Obejrzenie sesji bez kontekstu playlisty lub z cudzej playlisty nie wchodzi do licznika. To świadomy design — nawyk jest osobisty.

---

## 8. Migracje — chronologia

| Migracja | Co dodaje |
|---|---|
| `1775000000000` | Tabele `playlist`, `playlist_item`, FK, indeksy podstawowe |
| `1775000000001` | Tabela `weekly_plan_slot` z FK → playlist |
| `1775000000002` | `is_published`, tabela `playlist_rating`, indeks published |
| `1775000000005` | `user_activity.source_playlist_id` |
| `1775000000006` | `public_slug`, `public_view_count`, unikalny partial index |

---

## 9. Public Share — przepływ i architektura

```
Właściciel:
  PATCH /public/playlists/:id  { isPublished: true }
    → backend auto-generuje public_slug (jeśli brak)
    → odpowiedź zawiera publicSlug
  Frontend: "Kopiuj link" → navigator.clipboard.write("https://portalyogi.pl/p/{slug}")

Odwiedzający (bez JWT):
  GET /public/playlist-share/:slug
    → backend: SELECT WHERE public_slug = :slug AND is_published = true AND type = 'custom'
    → odpowiedź: nazwa, opis, itemCount, totalDurationMinutes, ownerName, items[], ogImageUrl, firstPlayableHref
  POST /public/playlist-share/track/:slug
    → INCREMENT public_view_count

Frontend /p/:slug:
  - React Query load landing
  - trackPublicShareView przy mount
  - document.title + meta og:title, og:description, og:image
  - zalogowany → przycisk "Rozpocznij praktykę" → /play/playlist/{id}
  - niezalogowany → "Zaloguj się, aby ćwiczyć" + "Dołącz do Portal Yogi"
```

**Ograniczenie obecnego OG:** meta ustawiane przez `useEffect` (client-side only).
Crawlery (Facebook, Twitter) nie wykonują JS — pełne OG wymaga SSR lub prerender middleware w przyszłości.

---

## 10. Spójność architektury — obecne granice

| Scenariusz | Obsługiwane? | Uwaga |
|---|---|---|
| Odtwarzanie własnej playlisty z kontekstem | ✅ | `getItems` + `source_playlist_id` |
| Odkrywanie i ocenianie cudzych | ✅ | `listPublished` / rating |
| Publiczny link bez konta | ✅ | `/p/:slug` bez JWT |
| Rejestracja czasu misji z cudzej playlisty | ❌ | `assertUserOwnsPlaylist` blokuje |
| Odtwarzanie `/play/playlist/{cudzyId}` przez zalogowanego niesubskrybenta | ❌ | ProtectedRoute + subscription |
| OG tagi dla crawlerów | ⚠️ | Client-only meta; SSR/prerender TODO |

---

## 11. Co z tego wyrasta — roadmapa kierunków

### Sprint 2 — paywall na playlistach

```
playlist.access_type:  free | premium | one_time | timed (7 dni)
```

Publiczny landing dostaje CTA „Kup dostęp" zamiast lub obok logowania.
Landing staje się stroną sprzedażową.

### Wirusowość (organiczne kanały wzrostu)

Każda opublikowana playlista to potencjalny nośnik wejścia:
- nauczyciel wysyła sekwencję uczniom
- użytkownik zaprasza znajomego na „wspólny tydzień"
- marketing pushuje link do lead magnetu

Metryki warte śledzenia:
- `public_view_count` (już zbierany)
- rejestracje z `state.from` zawierającego `/p/`
- powroty użytkowników zaproszonych linkiem

### V3 — inteligentne playlisty

Backend może generować playlisty na podstawie:
- historii aktywności użytkownika
- tagów sesji (stres, kręgosłup, rano, wieczór)
- poziomu zaawansowania
- czasu dostępnego (15 / 30 / 60 minut)

`type: 'generated'` — tylko do odczytu, bez edycji przez użytkownika.

### Nauczyciele i kursy

Playlista jako kurs: prowadzący tworzy sekwencję, uczniowie dostają link.
Naturalny krok do modelu B2B / grup / subskrypcji instytucjonalnych.

### Playlista jako wydarzenie

Playlista z typem `event` i oknem czasowym dostępu — „bilet" na wirtualne zajęcia lub serię.

---

## 12. Najważniejsza myśl architektury

Playlista zaczęła jako organizator.

Stała się silnikiem nawyku (plan tygodnia + misja).

Teraz staje się kanałem wzrostu (public share).

Każda nowa warstwa **używa tych samych encji** — nie dodaje nowych tabel, tylko nowe flagi i endpointy. To dobry znak.
