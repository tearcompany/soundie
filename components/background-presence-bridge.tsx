'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useSoundieStore } from '@/lib/soundie-store'
import { getNoteById } from '@/lib/notes'

const BASE_GAIN_IDLE = 0.032
const BASE_GAIN_DUCK = 0.006
const FADE_IN_SEC = 3.4
const FADE_OUT_SEC = 1.35
const FREQ_CROSS_SEC = 0.45
const RITUAL_NUDGE_AFTER_MS = 20 * 60 * 1000

type Graph = {
  ctx: AudioContext
  osc: OscillatorNode
  filter: BiquadFilterNode
  gain: GainNode
}

export function BackgroundPresenceBridge() {
  const router = useRouter()
  const t = useTranslations('backgroundPresence')

  const presenceEnabled = useSoundieStore((s) => s.presenceEnabled)
  const activeNoteId = useSoundieStore((s) => s.activeNoteId)
  const mainListenActive = useSoundieStore((s) => s.mainListenActive)

  const graphRef = useRef<Graph | null>(null)
  const breathRafRef = useRef<number | null>(null)
  const duckRef = useRef(false)
  const presenceStartedAtRef = useRef<number | null>(null)
  const ritualNudgeSentRef = useRef(false)

  const stopBreath = useCallback(() => {
    if (breathRafRef.current != null) {
      cancelAnimationFrame(breathRafRef.current)
      breathRafRef.current = null
    }
  }, [])

  const teardown = useCallback(async () => {
    stopBreath()
    const g = graphRef.current
    graphRef.current = null
    if (!g) return
    const { ctx, gain, osc } = g
    const now = ctx.currentTime
    try {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(gain.gain.value, now)
      gain.gain.linearRampToValueAtTime(0, now + FADE_OUT_SEC)
    } catch {
      /* noop */
    }
    await new Promise<void>((resolve) => {
      window.setTimeout(() => {
        try {
          osc.stop()
        } catch {
          /* noop */
        }
        try {
          void ctx.close()
        } catch {
          /* noop */
        }
        resolve()
      }, FADE_OUT_SEC * 1000 + 80)
    })
  }, [stopBreath])

  const applyFrequency = useCallback((frequency: number) => {
    const g = graphRef.current
    if (!g) return
    const { ctx, osc, gain } = g
    const now = ctx.currentTime
    try {
      osc.frequency.cancelScheduledValues(now)
      osc.frequency.setValueAtTime(osc.frequency.value, now)
      osc.frequency.linearRampToValueAtTime(frequency, now + FREQ_CROSS_SEC)
    } catch {
      osc.frequency.value = frequency
    }
    try {
      const v = gain.gain.value
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(v, now)
      gain.gain.linearRampToValueAtTime(v * 0.55, now + 0.06)
      gain.gain.linearRampToValueAtTime(
        (duckRef.current ? BASE_GAIN_DUCK : BASE_GAIN_IDLE) * 0.92,
        now + FREQ_CROSS_SEC + 0.15,
      )
    } catch {
      /* noop */
    }
  }, [])

  const startGraph = useCallback(
    (frequency: number, ducked: boolean) => {
      void (async () => {
        const AudioContextClass: typeof AudioContext =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new AudioContextClass()
        if (ctx.state === 'suspended') {
          try {
            await ctx.resume()
          } catch {
            await ctx.close().catch(() => {})
            return
          }
        }

        const gain = ctx.createGain()
        gain.gain.value = 0
        gain.connect(ctx.destination)

        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 2400
        filter.Q.value = 0.7
        filter.connect(gain)

        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = frequency
        osc.connect(filter)

        osc.start()
        graphRef.current = { ctx, osc, filter, gain }

        duckRef.current = ducked
        const now = ctx.currentTime
        const peak = ducked ? BASE_GAIN_DUCK : BASE_GAIN_IDLE
        gain.gain.linearRampToValueAtTime(peak, now + FADE_IN_SEC)

        const tick = () => {
          const gr = graphRef.current
          if (!gr) return
          const t0 = performance.now() / 1000
          const breath = 0.9 + 0.1 * Math.sin(t0 * 0.55)
          const duck = duckRef.current
          const base = duck ? BASE_GAIN_DUCK : BASE_GAIN_IDLE
          const target = Math.min(0.08, base * breath)
          const c = gr.ctx.currentTime
          try {
            gr.gain.gain.setTargetAtTime(target, c, 0.12)
          } catch {
            /* noop */
          }
          breathRafRef.current = requestAnimationFrame(tick)
        }
        breathRafRef.current = requestAnimationFrame(tick)

        requestAnimationFrame(() => {
          const id = useSoundieStore.getState().activeNoteId
          const d = getNoteById(id)
          if (d) applyFrequency(d.frequency)
        })
      })()
    },
    [applyFrequency],
  )

  useEffect(() => {
    duckRef.current = mainListenActive
    const g = graphRef.current
    if (!g) return
    const { ctx, gain } = g
    const now = ctx.currentTime
    const target = mainListenActive ? BASE_GAIN_DUCK : BASE_GAIN_IDLE
    try {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(Math.min(gain.gain.value, 0.08), now)
      gain.gain.setTargetAtTime(target * 0.94, now, 0.35)
    } catch {
      /* noop */
    }
  }, [mainListenActive])

  useEffect(() => {
    if (!presenceEnabled) {
      presenceStartedAtRef.current = null
      ritualNudgeSentRef.current = false
      void teardown()
      return
    }

    presenceStartedAtRef.current = Date.now()
    ritualNudgeSentRef.current = false

    const noteId = useSoundieStore.getState().activeNoteId
    const def = getNoteById(noteId)
    if (!def) return

    const ducked = useSoundieStore.getState().mainListenActive

    void (async () => {
      await teardown()
      startGraph(def.frequency, ducked)
    })()

    return () => {
      void teardown()
    }
  }, [presenceEnabled, startGraph, teardown])

  useEffect(() => {
    if (!presenceEnabled) return
    const def = getNoteById(activeNoteId)
    if (!def || !graphRef.current) return
    applyFrequency(def.frequency)
  }, [activeNoteId, presenceEnabled, applyFrequency])

  useEffect(() => {
    if (!presenceEnabled || presenceStartedAtRef.current == null) return

    const id = window.setInterval(() => {
      if (ritualNudgeSentRef.current) return
      const started = presenceStartedAtRef.current
      if (started == null) return
      if (Date.now() - started < RITUAL_NUDGE_AFTER_MS) return
      ritualNudgeSentRef.current = true
      toast.message(t('ritualNudge'), {
        description: t('ritualNudgeHint'),
        duration: 14_000,
        action: {
          label: t('ritualCta'),
          onClick: () => {
            router.push('/moje')
          },
        },
      })
    }, 45_000)

    return () => clearInterval(id)
  }, [presenceEnabled, router, t])

  return null
}
