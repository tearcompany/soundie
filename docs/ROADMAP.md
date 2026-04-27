# Soundie — 30 Day Execution Board

**Format:** gotowe taski dla developera / Cursora / Claude Code.
**Cel:** podbić D1 Return + 180s Listening Completion.

Ramy produktu (pętla użytkownika, minimum funkcji) — wspólny horyzont z tym planem: [`CORE-LOOP.md`](./CORE-LOOP.md).

> Zasada: codziennie ship coś małego.
> Nie czekaj na “idealne”.

## Stan względem tego repozytorium (skrót)

| Blok w pliku | W kodzie (realnie) |
|--------------|---------------------|
| Tydzień 1 — wizyty / return | `DailyVisit` używa `visitDate` (string dnia), nie `dateKey`; `returnEngine.logVisit` + `ReturnEngineBridge`; brak osobnej trasy `player.checkIn` |
| Tydzień 2 — nagroda dziennie | `DailyClaim` (nie `DailyRewardClaim`); `returnEngine.revealDailyClaim`; Teardrop + glow w Zustand / UI; analityka m.in. `daily_gift_*`; dodatkowo auto-unlock claim przy wejściu do `/sanctuary` (`SanctuaryUnlockBridge`) |
| Tydzień 3 — mood | `MoodEntry` + `mood.saveEntry`; UI `MoodCheckInBridge`; linie reakcji: `lib/mood-reaction-texts.ts` (5×12), nie osobny `mood.submit` |
| Tydzień 4 — share / admin | Część zdarzeń w `AnalyticsEvent` (np. `share_click`, `teardrop_open`, `sanctuary_enter`); **brak** dedykowanego `/api/share-card` i `/admin` w tym stanie — nadal na roadmapie |
| Poza planem 30 dni | `/sanctuary` + D3, nawigacja `SiteNav`, lore w karuzeli z `LoreFragment` (en/pl) + fallback i18n, auth OTP (tRPC + SMTP/Resend fallback), copy „tonacja afirmacji / intencja korelatywna” — opis: `ZAIMPLEMENTOWANE.md` |

Szczegóły techniczne (mapa kodu w tym repozytorium): [`ZAIMPLEMENTOWANE.md`](./ZAIMPLEMENTOWANE.md).

---

# TYDZIEŃ 1 — RETURN ENGINE

## Day 1 — Prisma + schema

### Task

Dodaj model:

```prisma
model DailyVisit {
  id        String   @id @default(cuid())
  playerId  String
  dateKey   String
  streak    Int      @default(1)
  createdAt DateTime @default(now())

  player Player @relation(fields: [playerId], references: [id])

  @@unique([playerId, dateKey])
}
```

### Ship:

* migration
* db push

---

## Day 2 — tRPC route

### Task

`player.checkIn`

Logic:

* jeśli today entry nie istnieje → create
* policz streak
* return:

```ts
{
  isFirstVisitToday: true,
  streak: 3,
  message: 'Your Soundie waited.',
}
```

---

## Day 3 — Frontend welcome back

### Task

Na `/play`:

* on load call `checkIn`
* modal / toast:

> Welcome back
> 3 nights of resonance

---

## Day 4 — Daily whisper content

### Task

Dodaj plik:

`lib/daily-whispers.ts`

Per note:

* C → “The Foundation feels steadier.”
* D → “The Dreamer kept watch.”

Losowanie 1/day.

---

## Day 5 — Analytics basic

Track events:

* app_open
* checkin_success
* play_clicked
* session_started
* session_completed_180

(Vercel / PostHog / console fallback)

---

## Day 6 — Polish day

* loading skeleton
* smoother modal
* no jank

---

## Day 7 — Review

Sprawdź:

* ilu wróciło?
* ilu kliknęło play?

---

# TYDZIEŃ 2 — REWARD LOOP

## Day 8 — Daily reward model

```prisma
model DailyRewardClaim {
 id String @id @default(cuid())
 playerId String
 dateKey String
 rewardType String

 @@unique([playerId, dateKey])
}
```

---

## Day 9 — Claim route

`tRPC reward.claimDaily`

Returns:

* caption unlock
* glow variant
* teardrop gift

---

## Day 10 — Reward UI

Po wejściu:

> Something formed overnight.

Button:

Open Gift

---

## Day 11 — Visual reward

Dodaj 3 glow states:

* soft amber
* silver mist
* violet pulse

---

## Day 12 — Daily Teardrop

1 karta dziennie z obecnej puli.

---

## Day 13 — UX cleanup

Nagroda subtelna, bez krzyku.

---

## Day 14 — Review metrics

Czy reward zwiększył session start rate?

---

# TYDZIEŃ 3 — MOOD SYSTEM

## Day 15 — DB model

```prisma
model MoodEntry {
 id String @id @default(cuid())
 playerId String
 mood String
 noteId String?
 createdAt DateTime @default(now())
}
```

---

## Day 16 — UI before session

Mini selector:

How do you feel?

* anxious
* heavy
* numb
* hopeful
* scattered

---

## Day 17 — Save mood

`tRPC mood.saveEntry` (w planie było `mood.submit`)

---

## Day 18 — Personalized line engine

```text
mood=anxious + note=C => "The Foundation hums lower today."
```

W kodzie: macierz w `lib/mood-reaction-texts.ts` (5 nastrojów × 12 nut), EN/PL.

---

## Day 19 — Inject into session start

Tuż przed startem audio.

---

## Day 20 — Metrics

Czy mood users słuchają dłużej?

---

## Day 21 — Review

Najczęstszy mood = insight marketingowy.

---

# TYDZIEŃ 4 — SHARE LOOP + TRUTH DATA

## Day 22 — Share card endpoint

Next.js image route:

`/api/share-card` (plan)

Image with:

* note name
* aura text
* subtle art

---

## Day 23 — Share button

After 180s complete:

Share your resonance

---

## Day 24 — Add stats events

* share_click
* share_complete (if detectable)
* teardrop_open
* lore_slide_view

Stan: `teardrop_open` i `sanctuary_enter` są już emitowane; `share_complete` i `lore_slide_view` nadal do dowiezienia.

---

## Day 25 — Dashboard

Prosty panel admina: `/admin` (plan)

Cards:

* New users
* D1 %
* Avg session
* Shares

---

## Day 26 — Segment data

Which note retains best?

---

## Day 27 — Copy rewrite

Make all copy feel sacred + calm.

---

## Day 28 — Performance

* bundle cleanup
* hydration issues
* mobile polish

---

## Day 29 — Invite 20 testers

Real humans only.

---

## Day 30 — Founder Truth Review

Spójrz tylko na:

1. D1 return
2. 180s completion
3. Avg session time
4. Shares
5. Organic comments

---

# Jeśli liczby są dobre:

## Month 2

* push notifications
* streak garden
* premium waitlist
* AI journeys

---

# Jeśli liczby są słabe:

Nie dodawaj feature’ów.
Napraw pierwszy minute experience.

---

# Brutal Priority Rule

Jeśli task nie wpływa na:

* powrót
* długość sesji
* emocję
* shareability

to odkładasz.

---

# Moja szczerość

Masz projekt, który może stać się **kultowym spokojnym produktem**.
Nie zabij go nadmiarem.

---

# Jeśli chcesz, mogę też dać **Top 10 funkcji, które zrobią z Soundie addictive-beautiful product jak Duolingo + Calm + Tamagotchi razem**.

---

## Next 3 Shipy (z aktualnego stanu)

1. **`lore_slide_view` analytics**
   - emit event przy wejściu na konkretny slajd lore (index, noteId, loreUnlocked, source)
   - dopiąć w `components/note-creature.tsx` do zmiany `selectedLoreIndex`

2. **`share_complete` (best effort)**
   - po `share_click` dopisać logikę wykrycia sukcesu share (Web Share API promise resolve + fallback copy link)
   - dodać event `share_complete` i osobno `share_copy_fallback` jeśli nie ma natywnego share

3. **Sanctuary: widok „dzisiejsza karta”**
   - pokazać aktywny daily claim (teardrop name/tagline/affirmation) bez potrzeby powrotu do `/play`
   - event `teardrop_open` rozszerzyć o `surface: 'sanctuary_card' | 'daily_gift_dialog'`
