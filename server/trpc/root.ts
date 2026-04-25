import { router } from './init'
import { noteRouter } from './routers/note'
import { playerRouter } from './routers/player'
import { soundieRouter } from './routers/soundie'

export const appRouter = router({
  note: noteRouter,
  player: playerRouter,
  soundie: soundieRouter,
})

export type AppRouter = typeof appRouter
