import { router } from './init'
import { noteRouter } from './routers/note'
import { playerRouter } from './routers/player'
import { soundieRouter } from './routers/soundie'
import { teardropRouter } from './routers/teardrop'

export const appRouter = router({
  note: noteRouter,
  player: playerRouter,
  soundie: soundieRouter,
  teardrop: teardropRouter,
})

export type AppRouter = typeof appRouter
