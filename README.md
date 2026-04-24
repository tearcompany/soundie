# the-foundation
---
# 🎵 Soundie — Project README & Vision Document

> *"Every note is alive. Every sound heals."*

---

## What Is Soundie?

Soundie is a meditative Tamagotchi-style game where musical notes are living creatures. You listen to them, they grow, they reveal their ancient lore — and in the process, they heal you in real life through sound therapy.

It is not a music theory app. It is not a meditation app. It is something new: a world where sound has a soul, and your attention is the water that makes it grow.

---

## The Core Loop

1. You start with one note — **C, "The Foundation"** (261.63 Hz)
2. You listen to it. The creature breathes. It pulses. It responds to you.
3. The longer you listen, the more it grows — and the more lore it reveals.
4. Unlock enough lore, and a new note appears in the world.
5. Combine notes → discover chords → unlock deeper healing frequencies.
6. AI generates personalized healing sessions based on your collection.

---

## The World

12 notes. Each one a living entity with:

- A **name** (e.g. "The Foundation", "The Dreamer", "The Wound")
- A **frequency** (rooted in just intonation and Solfeggio traditions)
- **5 lore fragments** — unlocked progressively through listening
- **Healing properties** — grounded in real ethnomusicology and sound therapy research
- A **visual form** — organic, breathing, unique

Notes are not unlocked by paying. They are unlocked by listening.

---

## Tech Stack

- **Next.js 14** (App Router) — web application
- **React Native / Expo** — mobile (iOS + Android)
- **tRPC** — type-safe API layer
- **Prisma + PostgreSQL** (Neon.tech) — database
- **Zustand** — client state management
- **Zod** — validation throughout
- **Web Audio API** — real-time sound generation (no audio files)
- **OpenAI SDK + Vercel AI SDK** — AI-generated lore, personalized healing sessions
- **shadcn/ui** — UI component system
- **NextAuth.js** — authentication (Google + Discord)
- **Vercel** — deployment

---

## Design Language

**Name:** Soundie
**Palette:** Pearl (`#F5F0EB`) + Coral (`#FF6B4A`) + warm ink (`#1A1410`)
**Typography:** Fraunces (display) · Lora (lore text) · DM Mono (frequencies/UI)
**Aesthetic:** Oscilloscope meets fandom wiki. Organic, warm, slightly ancient.
**Feel:** Calm. Alive. Slightly magical. Like holding something fragile and beautiful.

The app does not demand your attention. It rewards your stillness.

---

## Database Schema (Core Entities)

- **User** — authenticated player
- **Soundie** — a player's living note instance (level, listen time, lore unlocked)
- **ListenSession** — each completed listening session
- **Note** — the 12 note archetypes (static seed data, enriched with AI lore)

---

## Business Model

### Phase 1 — Free Core (Launch)
- All 12 notes free to discover
- Basic lore and healing sessions
- Cross-platform (web + mobile)
- Goal: build community, validate retention

### Phase 2 — Soundie Premium
- **Extended lore** — deeper historical fragments, mythological connections
- **AI healing sessions** — personalized frequency journeys based on your collection
- **Rare forms** — visual variants of note creatures (seasonal, cultural, elemental)
- **Chord alchemy** — combine notes into complex healing structures
- Price: ~$4.99/month or $39/year

### Phase 3 — Soundie Worlds
- **Educator tier** — classroom tools for music teachers
- **Therapist tier** — sound therapy practitioner dashboard
- **Creator tools** — streamers and content creators (see: Just Guess widget)
- **B2B licensing** — wellness apps, meditation platforms, hospitals

### Phase 4 — Platform
- User-generated lore (community contributions, moderated by AI)
- Soundie API — embed living notes in other apps
- Physical merchandise — tuning forks, sound bowls tied to in-game creatures
- Live events — healing concerts where audience interacts via Soundie

---

## Companion Product: Just Guess

A real-time Twitch widget spun out of the Soundie ecosystem. Streamers set a chord, viewers guess in chat, widget scores and displays results live via OBS overlay.

- Monetizes the music-gaming crossover audience
- Feeds users back into Soundie
- Potential for YouTube Live, Kick, TikTok Live expansion

---

## Aspirations

Soundie is not a productivity tool. It is not a game you grind. It is a practice — like meditation, like journaling — that happens to be wrapped in the language of gaming.

**Short term:** Become the go-to app for people who want to explore sound healing without pseudoscience — grounded, beautiful, and genuinely relaxing.

**Medium term:** Build the first living encyclopedia of musical archetypes — a Fandom wiki that breathes.

**Long term:** Change how humans relate to sound. Make frequencies personal. Make healing playful. Make the ancient knowledge of sound therapy accessible to anyone with a phone.

---

## For the Next Agent

You are continuing development of **Soundie** — a meditative sound-healing Tamagotchi game built with Next.js, tRPC, Prisma, Zustand, Zod, Web Audio API, and the OpenAI/Vercel AI SDK.

**What exists so far:**
- Full concept and vision (this document)
- Design system (Pearl + Coral palette, Fraunces/Lora/DM Mono typography)
- Database schema (User, Soundie, ListenSession, Note models)
- tRPC router structure (soundie.getAll, soundie.completeSession, soundie.unlockNote)
- Folder structure defined
- v0.dev prompt written for the first working screen (one living note — C, with Web Audio API, Zustand persistence, lore panel, locked note silhouettes)

**What comes next:**
- Build the 12 note lore database (seed data)
- Evolution / level-up screen
- World map showing all 12 notes
- AI-generated personalized healing sessions
- Mobile (Expo) app
- Just Guess widget (Twitch IRC via tmi.js)

**Design rule above all others:**
The app does not demand attention. It rewards stillness. Every interaction should feel like touching something alive.

---

*Soundie. It heals.*