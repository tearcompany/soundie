import { PrismaClient } from '@prisma/client'
import { NOTE_LIST, EMOTIONS, getLoreFragmentsForNote, type NoteEntry } from '../lib/notes'

const prisma = new PrismaClient()

function buildFragments(note: NoteEntry): string[] {
  return getLoreFragmentsForNote(note.id)
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
      INSERT INTO "Emotion" ("id", "namePl", "descriptionPl")
      VALUES (${emotion.id}, ${emotion.namePl}, ${emotion.descriptionPl})
      ON CONFLICT ("id") DO UPDATE
      SET "namePl" = EXCLUDED."namePl", "descriptionPl" = EXCLUDED."descriptionPl"
    `
  }

  let order = 0
  for (const n of NOTE_LIST) {
    const fragments = buildFragments(n)
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
    for (let i = 0; i < fragments.length; i++) {
      await prisma.$executeRaw`
        INSERT INTO "LoreFragment" ("id", "noteId", "orderIndex", "body")
        VALUES (gen_random_uuid()::text, ${n.id}, ${i}, ${fragments[i]!})
      `
    }

    await prisma.$executeRaw`DELETE FROM "NoteCaption" WHERE "noteId" = ${n.id}`
    for (let i = 0; i < n.captions.length; i++) {
      await prisma.$executeRaw`
        INSERT INTO "NoteCaption" ("id", "noteId", "orderIndex", "body")
        VALUES (gen_random_uuid()::text, ${n.id}, ${i}, ${n.captions[i]!})
      `
    }

    order += 1
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
