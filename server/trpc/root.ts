import { router } from './init'
import { analyticsRouter } from './routers/analytics'
import { noteRouter } from './routers/note'
import { playerRouter } from './routers/player'
import { returnEngineRouter } from './routers/returnEngine'
import { soundieRouter } from './routers/soundie'
import { teardropRouter } from './routers/teardrop'
import { moodRouter } from './routers/mood'
import { sanctuaryRouter } from './routers/sanctuary'
import { otpRouter } from './routers/otp'
import { mindfulMomentRouter } from './routers/mindfulMoment'
import { adminRouter } from './routers/admin'

export const appRouter = router({
  admin: adminRouter,
  analytics: analyticsRouter,
  note: noteRouter,
  player: playerRouter,
  returnEngine: returnEngineRouter,
  soundie: soundieRouter,
  teardrop: teardropRouter,
  mood: moodRouter,
  sanctuary: sanctuaryRouter,
  otp: otpRouter,
  mindfulMoment: mindfulMomentRouter,
})

export type AppRouter = typeof appRouter
