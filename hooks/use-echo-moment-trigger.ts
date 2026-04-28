import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'echo_moment_last_shown'
const MIN_GAP_MS = 3 * 24 * 60 * 60 * 1000
const TRIGGER_CHANCE = 0.2

export function useEchoMomentTrigger() {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const last = parseInt(raw, 10)
      if (!Number.isNaN(last) && Date.now() - last < MIN_GAP_MS) return
    }
    if (Math.random() > TRIGGER_CHANCE) return
    const t = window.setTimeout(() => setShouldShow(true), 2400)
    return () => window.clearTimeout(t)
  }, [])

  const acknowledge = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, Date.now().toString())
    }
    setShouldShow(false)
  }, [])

  return { shouldShow, acknowledge }
}
