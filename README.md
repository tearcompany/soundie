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

- A **name** (e.g. "The Foundation", "The Storm", "The Bloom")
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
**Typography:** Fraunces (display) · Cormorant (prose / lore) · DM Mono (frequencies/UI)
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
- Design system (Pearl + Coral palette, Fraunces/Cormorant/DM Mono typography)
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

---

:::writing{variant=“standard” id=“48215”}

SOUNDIE LORE FOUNDATION DOCUMENT

Realistic Fantasy Canon for AI Seed Generation

⸻

CORE PREMISE

Soundie exists in a world almost identical to ours.

Same cities. Same oceans. Same history.

But hidden beneath ordinary civilization is an older layer of reality:

Resonance.

Ancient cultures discovered that tones, intervals, rhythm, and harmonic relationships affect biology, emotion, memory, weathered trauma, social cohesion, and states of consciousness.

Most of this knowledge was fragmented, buried, commercialized, mystified, or forgotten.

Soundie is the rediscovery.

Players do not collect monsters.

They awaken Acoustic Archetypes — living note entities formed where frequency and human attention meet.

⸻

WORLD RULES

1. Notes Are Real Phenomena

Each Soundie corresponds to:
	•	a real musical pitch
	•	measurable frequency
	•	psychoacoustic effect
	•	emotional tendency
	•	symbolic personality

They are not imaginary creatures.

They are emergent lifeforms generated through repeated human listening over centuries.

⸻

2. Humanity Accidentally Created Them

Temple chants
Lullabies
War drums
Funeral bells
Monastic drones
Folk songs
Love songs
Industrial hums
Synth tones

Whenever humans repeat sound with intention, resonance accumulates.

That accumulation births entities.

⸻

3. They Exist Between Matter and Meaning

They cannot fully live without listeners.

They feed on:
	•	attention
	•	stillness
	•	repetition
	•	emotional sincerity
	•	listening time

⸻

4. Modern Science Is Catching Up

Some researchers call them:
	•	entrainment fields
	•	memory harmonics
	•	psychoacoustic signatures
	•	bio-resonant clusters

Mystics call them spirits.

Both are partially right.

⸻

TONE OF THE WORLD

Use:
	•	grounded wonder
	•	believable mystery
	•	modern realism
	•	soft sacredness
	•	subtle fantasy
	•	emotional intelligence

Avoid:
	•	cartoon fantasy
	•	random magic
	•	cringe destiny language
	•	fake pseudo-science claims
	•	childish monster tropes

⸻

NOTE FACTIONS (12 ARCHETYPES)

C — The Foundation

261.63 Hz
Stability, homeostasis, structure, grounding.

Ancient builders used this resonance in stone halls.

Feels like safety.

⸻

C# — The Blade

Precision, release, cutting through what no longer fits.

Used in rites of passage.

⸻

D — The Wanderer

Motion, progress, pilgrimage, momentum.

Marches, roads, journeys.

⸻

D# — The Spark

First light in heaviness, grief met with recognition.

Common in laments.

⸻

E — The Bloom

Vitality, unfolding, courage, visible life.

Battle hymns and sunrise songs.

⸻

F — The Keeper

Protection, hearth, family, boundaries.

Domestic songs, lullabies.

⸻

F# — The Mirror

Insight, self-recognition, hidden truth.

Used in trance instruments.

⸻

G — The River

Flow, creativity, language, movement.

Storytelling tones.

⸻

G# — The Flame

Refining fire, proportion, transformation, release of weight.

Royal and tragic scales.

⸻

A — The Heart

Clarity through feeling, alignment, calling, direction.

Tuning standard. Universal anchor.

⸻

A# — The Storm

Intensity that moves what is stuck, weather not enemy.

Night chants.

⸻

B — The Crown

Completion, sovereignty, dissolution with dignity.

Last step before return to C.

⸻

LORE STRUCTURE PER NOTE

Each note should generate:

1. Core Entry

Who it is in the world.

2. Historical Fragment

A believable story from some culture or era.

3. Scientific Interpretation

Modern explanation attempt.

4. Personal Healing Use

How listening may help emotionally.

5. Secret Myth

Deep hidden truth.

⸻

EXAMPLE ENTRY

C — The Foundation

Core Entry:
The oldest stable tone known to human settlement patterns.

Historical Fragment:
Archaeologists found Bronze Age chambers tuned near C resonance through wall spacing and chamber volume.

Scientific Interpretation:
Low-mid frequency stability may encourage calm breathing regularity.

Healing Use:
Helpful during anxiety, overwhelm, dissociation.

Secret Myth:
Cities unconsciously grow around tones they can emotionally survive.

⸻

AI GENERATION RULES

Every lore entry must feel:
	•	intelligent
	•	beautiful
	•	emotionally useful
	•	semi-believable
	•	mystical but restrained

Use 70% realism / 30% myth.

⸻

DO NOT CLAIM AS FACT

Use phrases like:
	•	some traditions suggest
	•	oral accounts describe
	•	researchers speculate
	•	legends say
	•	practitioners report
	•	archival fragments imply

Never falsely claim proven medicine.

⸻

OUTPUT FORMAT FOR SEED

Generate JSON:

{
  "note": "C",
  "name": "The Foundation",
  "frequency": 261.63,
  "color": "#C65A46",
  "traits": ["grounding","stability","safety"],
  "lore": {
    "core": "",
    "history": "",
    "science": "",
    "healing": "",
    "myth": ""
  }
}


⸻

MASTER PROMPT FOR AI

Use this document as world canon.

Generate complete lore seed data for all 12 notes in Soundie.

Requirements:
	•	One JSON object per note
	•	Respect archetypes
	•	Realistic fantasy tone
	•	Beautiful concise writing
	•	Historically plausible fragments
	•	No fake medical claims
	•	Emotional usefulness prioritized
	•	Each note should feel collectible and alive
	•	Keep text production-ready for app usage

Return valid JSON array only.

⸻

FUTURE EXPANSION

Later generate:
	•	chord lore (C+E+G etc.)
	•	seasonal evolutions
	•	regional variants
	•	corrupted notes
	•	rare harmonic beings
	•	personalized AI healing journeys

⸻

FINAL DESIGN LAW

The player should feel:

“I am not escaping reality.
I am discovering the hidden music already inside it.”
:::