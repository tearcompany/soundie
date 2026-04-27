import { db } from '@/lib/db'
import { auth } from '@/auth'

export async function createContext() {
  const session = await auth()
  return { db, session }
}

export type Context = Awaited<ReturnType<typeof createContext>>
