import { db } from '@/lib/db'

export function createContext() {
  return { db }
}

export type Context = ReturnType<typeof createContext>
