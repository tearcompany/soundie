import { router } from './init'
import { echoRouter } from './routers/echo'
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
import { dailyMissionRouter } from './routers/dailyMission'
import { todayRouter } from './routers/today'
import { resonanceRouter } from './routers/resonance'
import { ritualRouter } from './routers/ritual'
import { sessionReflectionRouter } from './routers/sessionReflection'

export const appRouter = router({
  admin: adminRouter,
  echo: echoRouter,
  analytics: analyticsRouter,
  dailyMission: dailyMissionRouter,
  today: todayRouter,
  note: noteRouter,
  player: playerRouter,
  ritual: ritualRouter,
  sessionReflection: sessionReflectionRouter,
  resonance: resonanceRouter,
  returnEngine: returnEngineRouter,
  soundie: soundieRouter,
  teardrop: teardropRouter,
  mood: moodRouter,
  sanctuary: sanctuaryRouter,
  otp: otpRouter,
  mindfulMoment: mindfulMomentRouter,
})

export type AppRouter = typeof appRouter
