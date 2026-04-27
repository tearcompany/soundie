import { PrismaClient } from '@prisma/client'
import { NOTE_LIST, EMOTIONS } from '../lib/notes'
import { TEARDROP_VESSEL_BOOK_PRIMARY_SLUG } from '../lib/teardrop-ksiega'
import enMessages from '../messages/en.json'
import plMessages from '../messages/pl.json'
import noteCaptionsByLocale from '../data/note-captions-by-locale.json'
import teardropCardTextsEn from '../data/teardrop-card-texts-en.json'
import teardropCardTextsPl from '../data/teardrop-card-texts-pl.json'
import { TEARDROP_CARDS } from './teardrop-cards-meta'
import {
  assertTeardropEmotionMapMatchesDeck,
  TEARDROP_EMOTION_ID_BY_SLUG,
} from '../lib/teardrop-card-emotion'

const prisma = new PrismaClient()

type MessagesShape = {
  noteCreature: {
    lore: Record<string, string[]>
  }
  teardropDeck?: Record<
    string,
    {
      tagline: string
      description: string
      meaningUpright: string
      meaningShadow: string
      affirmation: string
    }
  >
}

const CAPTIONS_BY_LOCALE: Record<'en' | 'pl', Record<string, string[]>> = {
  en: noteCaptionsByLocale.en as Record<string, string[]>,
  pl: noteCaptionsByLocale.pl as Record<string, string[]>,
}

const LORE_BY_LOCALE = {
  en: (enMessages as MessagesShape).noteCreature.lore,
  pl: (plMessages as MessagesShape).noteCreature.lore,
} as const

const TEARDROP_EN_FROM_MESSAGES =
  ((enMessages as MessagesShape).teardropDeck as Record<string, TeardropTextBlock> | undefined) ?? {}

type TeardropTextBlock = {
  tagline: string
  description: string
  meaningUpright: string
  meaningShadow: string
  affirmation: string
}

const TEARDROP_PHASES = [
  { slug: 'roots', titlePl: 'Korzenie', titleEn: 'Roots', unlockOrder: 1, xpPerUnlock: 10 },
  { slug: 'flow', titlePl: 'Przepływ', titleEn: 'Flow', unlockOrder: 2, xpPerUnlock: 15 },
  { slug: 'void', titlePl: 'Pustka', titleEn: 'Void', unlockOrder: 3, xpPerUnlock: 20 },
  { slug: 'light', titlePl: 'Światło', titleEn: 'Light', unlockOrder: 4, xpPerUnlock: 25 },
  { slug: 'archetypes', titlePl: 'Archetypy', titleEn: 'Archetypes', unlockOrder: 5, xpPerUnlock: 35 },
] as const

const NOTE_TEARDROP_PLAYLIST: Record<string, string[]> = {
  C:   ['the-vessel', 'the-seed', 'the-core', 'the-anchor', 'the-path'],
  'C#': ['the-echo', 'the-crossing', 'the-whisper', 'the-veil', 'the-return'],
  D:   ['the-path', 'the-seed', 'the-stream', 'the-pulse', 'the-bridge'],
  'D#': ['the-seed', 'the-vessel', 'the-silence', 'the-abyss', 'the-shadow'],
  E:   ['the-lightkeeper', 'the-flame', 'the-glow', 'the-beam', 'the-sun'],
  F:   ['the-spiral', 'the-guardian', 'the-anchor', 'the-soil', 'the-sanctuary'],
  'F#': ['the-watcher', 'the-mirror', 'the-prism', 'the-echo', 'the-witness'],
  G:   ['the-wave', 'the-stream', 'the-tide', 'the-drift', 'the-surge'],
  'G#': ['the-pulse', 'the-flame', 'the-breaker', 'the-shadow', 'the-spiral'],
  A:   ['the-beam', 'the-star', 'the-sun', 'the-path', 'the-lightkeeper'],
  'A#': ['the-drift', 'the-whisper', 'the-silence', 'the-fog', 'the-vessel'],
  B:   ['the-return', 'the-veil', 'the-pause', 'the-abyss', 'the-teardrop-bearer'],
}

{
  const vesselBook = TEARDROP_VESSEL_BOOK_PRIMARY_SLUG as Record<string, string>
  for (const noteId of Object.keys(vesselBook)) {
    const want = vesselBook[noteId]
    const got = NOTE_TEARDROP_PLAYLIST[noteId]?.[0]
    if (got !== want) {
      throw new Error(
        `Teardrop playlist: note ${noteId} must start with ${want}, got ${String(got)}`,
      )
    }
  }
}

function buildFragments(noteId: string, locale: 'en' | 'pl'): string[] {
  return LORE_BY_LOCALE[locale][noteId] ?? []
}

async function main() {
  await prisma.$executeRawUnsafe(`
    DELETE FROM "Note" a
    USING "Note" b
    WHERE a.ctid < b.ctid AND a."id" = b."id"
  `)
  await prisma.$executeRawUnsafe(`
    DELETE FROM "Note" a
    USING "Note" b
    WHERE a.ctid < b.ctid AND a."urlKey" = b."urlKey"
  `)
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      BEGIN
        ALTER TABLE "Note" ADD CONSTRAINT "Note_pkey" PRIMARY KEY ("id");
      EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN SQLSTATE '42P16' THEN NULL;
      END;
    END
    $$;
  `)
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      BEGIN
        ALTER TABLE "Note" ADD CONSTRAINT "Note_urlKey_key" UNIQUE ("urlKey");
      EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN SQLSTATE '42P07' THEN NULL;
      END;
    END
    $$;
  `)

  for (const emotion of EMOTIONS) {
    await prisma.$executeRaw`
      INSERT INTO "Emotion" ("id", "namePl", "nameEn", "descriptionPl", "descriptionEn")
      VALUES (
        ${emotion.id},
        ${emotion.namePl},
        ${emotion.nameEn ?? null},
        ${emotion.descriptionPl},
        ${emotion.descriptionEn ?? null}
      )
      ON CONFLICT ("id") DO UPDATE
      SET
        "namePl" = EXCLUDED."namePl",
        "nameEn" = EXCLUDED."nameEn",
        "descriptionPl" = EXCLUDED."descriptionPl",
        "descriptionEn" = EXCLUDED."descriptionEn"
    `
  }

  const deck = await prisma.teardropDeck.upsert({
    where: { slug: 'teardrop-oracle-deck-v0' },
    create: {
      slug: 'teardrop-oracle-deck-v0',
      name: 'Teardrop Oracle Deck',
      version: 'v0',
      source: 'inline',
    },
    update: {
      name: 'Teardrop Oracle Deck',
      version: 'v0',
      source: 'inline',
    },
  })

  console.log(`[seed] deck: ${deck.id}`)

  for (const phase of TEARDROP_PHASES) {
    await prisma.teardropPhase.upsert({
      where: { deckId_slug: { deckId: deck.id, slug: phase.slug } },
      create: {
        deckId: deck.id,
        slug: phase.slug,
        titlePl: phase.titlePl,
        titleEn: phase.titleEn,
        unlockOrder: phase.unlockOrder,
        xpPerUnlock: phase.xpPerUnlock,
      },
      update: {
        titlePl: phase.titlePl,
        titleEn: phase.titleEn,
        unlockOrder: phase.unlockOrder,
        xpPerUnlock: phase.xpPerUnlock,
      },
    })
  }

  assertTeardropEmotionMapMatchesDeck(TEARDROP_CARDS.map((c) => c.slug))

  const teardropCardIdBySlug = new Map<string, string>()

  for (const card of TEARDROP_CARDS) {
    const emotionId =
      TEARDROP_EMOTION_ID_BY_SLUG[
        card.slug as keyof typeof TEARDROP_EMOTION_ID_BY_SLUG
      ] ?? null
    if (emotionId == null) {
      throw new Error(`[seed] teardrop card missing Emotion: ${card.slug}`)
    }
    const upserted = await prisma.teardropCard.upsert({
      where: { deckId_slug: { deckId: deck.id, slug: card.slug } },
      create: {
        deckId: deck.id,
        slug: card.slug, 
        name: card.name,
        phase: card.phase,
        phaseOrder: card.phaseOrder,
        arcanaType: card.arcanaType,
        suit: card.suit,
        cardNumber: card.cardNumber,
        sourcePath: 'inline',
        isTemplate: false,
        emotionId,
      },
      update: {
        name: card.name,
        phase: card.phase,
        phaseOrder: card.phaseOrder,
        arcanaType: card.arcanaType,
        suit: card.suit,
        cardNumber: card.cardNumber,
        sourcePath: 'inline',
        isTemplate: false,
        emotionId,
      },
    })
    teardropCardIdBySlug.set(card.slug, upserted.id)

    const plBlock = (teardropCardTextsPl as Record<string, TeardropTextBlock>)[
      card.slug
    ]
    if (!plBlock) {
      console.warn(`[seed] missing PL teardrop block for: ${card.slug}`)
    } else {
      const plFields = [
        ['tagline', plBlock.tagline],
        ['description', plBlock.description],
        ['meaning_upright', plBlock.meaningUpright],
        ['meaning_shadow', plBlock.meaningShadow],
        ['affirmation', plBlock.affirmation],
      ] as const
      for (const [field, content] of plFields) {
        if (!content) continue
        await prisma.teardropCardText.upsert({
          where: { cardId_locale_field: { cardId: upserted.id, locale: 'pl', field } },
          create: { cardId: upserted.id, locale: 'pl', field, content },
          update: { content },
        })
      }
    }

    const enFromMessages = TEARDROP_EN_FROM_MESSAGES[card.slug]
    const enFromData = (teardropCardTextsEn as Record<string, TeardropTextBlock>)[card.slug]
    const enBlock = enFromMessages ?? enFromData
    if (enBlock) {
      const enFields = [
        ['tagline', enBlock.tagline],
        ['description', enBlock.description],
        ['meaning_upright', enBlock.meaningUpright],
        ['meaning_shadow', enBlock.meaningShadow],
        ['affirmation', enBlock.affirmation],
      ] as const
      for (const [field, content] of enFields) {
        if (!content) continue
        await prisma.teardropCardText.upsert({
          where: { cardId_locale_field: { cardId: upserted.id, locale: 'en', field } },
          create: { cardId: upserted.id, locale: 'en', field, content },
          update: { content },
        })
      }
    } else {
      console.warn(`[seed] missing English teardrop block for: ${card.slug}`)
    }

    console.log(
      `  [card] ${card.slug} (pl affirmation: ${plBlock?.affirmation ? 'yes' : 'no'})`,
    )
  }

  let order = 0
  for (const n of NOTE_LIST) {
    const noteData = {
      id: n.id,
      short: n.short,
      name: n.name,
      frequency: n.frequency,
      urlKey: n.urlKey,
      locked: n.locked,
      healing: n.healing,
      chromaHex: n.chromaHex,
      synestheticTitlePl: n.synestheticTitlePl,
      synestheticLinePl: n.synestheticLinePl,
      element: n.element,
      sortOrder: order,
      emotionId: n.emotionId,
      healingStyle: n.healingStyle,
    }
    await prisma.note.upsert({
      where: { id: n.id },
      create: noteData as any,
      update: noteData as any,
    })

    await prisma.$executeRaw`DELETE FROM "LoreFragment" WHERE "noteId" = ${n.id}`
    for (const loc of ['en', 'pl'] as const) {
      const locFragments = buildFragments(n.id, loc)
      for (let i = 0; i < locFragments.length; i++) {
        await prisma.$executeRaw`
          INSERT INTO "LoreFragment" ("id", "noteId", "orderIndex", "locale", "body")
          VALUES (gen_random_uuid()::text, ${n.id}, ${i}, ${loc}, ${locFragments[i]!})
        `
      }
    }

    await prisma.$executeRaw`DELETE FROM "NoteCaption" WHERE "noteId" = ${n.id}`
    for (const locale of ['en', 'pl'] as const) {
      const captions = CAPTIONS_BY_LOCALE[locale][n.id] ?? []
      for (let i = 0; i < captions.length; i++) {
        await prisma.$executeRaw`
          INSERT INTO "NoteCaption" ("id", "noteId", "locale", "orderIndex", "body")
          VALUES (gen_random_uuid()::text, ${n.id}, ${locale}, ${i}, ${captions[i]!})
        `
      }
    }

    order += 1
  }

  await prisma.noteTeardropCard.deleteMany({})
  let linked = 0
  for (const noteId of Object.keys(NOTE_TEARDROP_PLAYLIST)) {
    const playlist = NOTE_TEARDROP_PLAYLIST[noteId] ?? []
    for (let i = 0; i < playlist.length; i++) {
      const slug = playlist[i]!
      const cardId = teardropCardIdBySlug.get(slug)
      if (!cardId) {
        console.warn(`  [warn] card not found for slug: ${slug} (note: ${noteId})`)
        continue
      }
      await prisma.noteTeardropCard.create({
        data: { noteId, cardId, sortOrder: i },
      })
      linked++
    }
  }

  console.log(`[seed] done — ${TEARDROP_CARDS.length} cards, ${linked} note-card links`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
