/**
 * Standalone: upsert ChordPreset — nutowe (66 dyadów + triady/tetrady)
 * oraz warstwa archetypów (`noteKey` = arc:* , `noteIds` = []).
 * Run: `pnpm db:seed:chords` or `npm run db:seed:chords`
 */
import { PrismaClient } from '@prisma/client'
import { seedChordPresets } from './seed-chord-presets'

async function main() {
  const prisma = new PrismaClient()
  try {
    await seedChordPresets(prisma)
  } finally {
    await prisma.$disconnect()
  }
  
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
