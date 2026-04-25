'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

type LandingNote = {
  id: string
  freq: number
  hex: string
  name: string
}

const NOTES: LandingNote[] = [
  { id: 'C',  freq: 261.63, hex: '#6B1D1D', name: 'The Foundation' },
  { id: 'D',  freq: 293.66, hex: '#B45309', name: 'The Dreamer'   },
  { id: 'E',  freq: 329.63, hex: '#CA8A04', name: 'The Wound'     },
  { id: 'F',  freq: 349.23, hex: '#4D7C0F', name: 'The Sanctuary' },
  { id: 'G',  freq: 392.00, hex: '#047857', name: 'The Traveler'  },
  { id: 'A',  freq: 440.00, hex: '#0284C7', name: 'The Mirror'    },
  { id: 'B',  freq: 493.88, hex: '#5B21B6', name: 'The Threshold' },
]

const LINES = [
  'Twelve notes. Each one alive.',
  'Listen long enough — they grow.',
  'No scores. No timers.',
  'Only presence.',
  'Soundie heals.',
] as const

const PREVIEW_SECONDS = 4

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => setReduced(m.matches)
    handler()
    m.addEventListener('change', handler)
    return () => m.removeEventListener('change', handler)
  }, [])
  return reduced
}

function useCycledLine(lines: readonly string[], ms: number, paused: boolean) {
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(true)
  useEffect(() => {
    if (paused) return
    const t = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIdx((i) => (i + 1) % lines.length)
        setFade(true)
      }, 500)
    }, ms)
    return () => clearInterval(t)
  }, [lines, ms, paused])
  return { line: lines[idx]!, fade }
}

type AudioRefs = {
  ctx: AudioContext | null
  osc: OscillatorNode | null
  gain: GainNode | null
  stopTimer: ReturnType<typeof setTimeout> | null
}

function useNotePreview() {
  const refs = useRef<AudioRefs>({ ctx: null, osc: null, gain: null, stopTimer: null })
  const [playingId, setPlayingId] = useState<string | null>(null)

  const stop = useCallback((immediate = false) => {
    const { ctx, osc, gain, stopTimer } = refs.current
    if (stopTimer) {
      clearTimeout(stopTimer)
      refs.current.stopTimer = null
    }
    if (osc && ctx && gain) {
      const now = ctx.currentTime
      const fadeOut = immediate ? 0.05 : 0.4
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(gain.gain.value, now)
      gain.gain.linearRampToValueAtTime(0, now + fadeOut)
      const oscRef = osc
      setTimeout(() => {
        try { oscRef.stop() } catch {}
      }, fadeOut * 1000 + 30)
      refs.current.osc = null
    }
    setPlayingId(null)
  }, [])

  const play = useCallback((note: LandingNote) => {
    if (typeof window === 'undefined') return
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return

    if (refs.current.ctx == null) {
      refs.current.ctx = new Ctor()
    }
    const ctx = refs.current.ctx!
    if (ctx.state === 'suspended') ctx.resume()

    stop(true)

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = note.freq
    const now = ctx.currentTime
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.18, now + 0.4)
    gain.gain.setValueAtTime(0.18, now + PREVIEW_SECONDS - 0.6)
    gain.gain.linearRampToValueAtTime(0, now + PREVIEW_SECONDS)
    osc.connect(gain).connect(ctx.destination)
    osc.start()

    refs.current.osc = osc
    refs.current.gain = gain
    setPlayingId(note.id)

    refs.current.stopTimer = setTimeout(() => {
      try { osc.stop() } catch {}
      refs.current.osc = null
      setPlayingId((cur) => (cur === note.id ? null : cur))
    }, PREVIEW_SECONDS * 1000 + 50)
  }, [stop])

  useEffect(() => () => stop(true), [stop])

  return { play, stop, playingId }
}

function NoteOrb({
  note,
  hovered,
  playing,
  reducedMotion,
}: {
  note: LandingNote
  hovered: boolean
  playing: boolean
  reducedMotion: boolean
}) {
  const showRing = (hovered || playing) && !reducedMotion
  return (
    <span className="relative flex h-7 w-7 items-center justify-center" aria-hidden>
      {showRing && (
        <span
          className="absolute inset-0 rounded-full opacity-30"
          style={{
            backgroundColor: note.hex,
            animation: `orb-ping ${playing ? 1.4 : 2.4}s cubic-bezier(0,0,0.2,1) infinite`,
          }}
        />
      )}
      <span
        className="relative block h-3 w-3 rounded-full transition-all duration-300"
        style={{
          backgroundColor: note.hex,
          boxShadow: hovered || playing ? `0 0 12px 3px ${note.hex}66` : 'none',
        }}
      />
    </span>
  )
}

export function SoundieLanding() {
  const reducedMotion = usePrefersReducedMotion()
  const { play, stop, playingId } = useNotePreview()
  const [hovered, setHovered] = useState<string | null>(null)
  const focusedNote = NOTES.find((n) => n.id === (playingId ?? hovered)) ?? null
  const { line, fade } = useCycledLine(LINES, 3800, reducedMotion)

  const handleSelect = useCallback(
    (note: LandingNote) => {
      if (playingId === note.id) {
        stop()
      } else {
        play(note)
      }
    },
    [play, stop, playingId],
  )

  return (
    <div
      className="relative min-h-dvh overflow-hidden transition-colors duration-1000"
      style={{
        backgroundColor: focusedNote
          ? `color-mix(in srgb, ${focusedNote.hex} 6%, var(--pearl))`
          : 'var(--pearl)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {NOTES.map((n, i) => (
          <span
            key={n.id}
            className="absolute rounded-full blur-3xl transition-opacity duration-700"
            style={{
              width: 220,
              height: 220,
              backgroundColor: n.hex,
              opacity: focusedNote?.id === n.id ? 0.14 : 0.04,
              top: `${15 + (i * 11) % 65}%`,
              left: `${5 + (i * 13) % 85}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>

      <header className="relative z-10 flex items-center justify-between border-b border-pearl-border/40 px-6 py-5">
        <Link
          href="/"
          className="font-[family-name:var(--font-fraunces,serif)] text-xl font-semibold tracking-tight text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-coral rounded-sm"
        >
          Soundie
        </Link>
        <p className="font-mono text-xs text-ink-muted">261.63 – 493.88 Hz</p>
      </header>

      <main className="relative z-10 mx-auto max-w-xl px-6 pb-24 pt-20 sm:pt-28">
        <p
          className="mb-10 text-center font-mono text-xs uppercase tracking-[0.22em] transition-opacity duration-500"
          style={{
            color: focusedNote?.hex ?? 'var(--coral)',
            opacity: fade ? 1 : 0,
          }}
          aria-live="polite"
        >
          {line}
        </p>

        <h1 className="text-center font-[family-name:var(--font-fraunces,serif)] text-4xl font-bold leading-tight text-ink sm:text-5xl">
          Sound that knows<br />you&apos;re here.
        </h1>

        <p className="mt-6 text-center font-[family-name:var(--font-lora,serif)] text-base leading-relaxed text-ink-muted">
          A meditative world of living notes. Each one heals something different.
          The longer you listen, the more it reveals.
        </p>

        <p className="mt-3 text-center font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-muted">
          Tap a note to hear it
        </p>

        <div
          className="mt-6 flex flex-wrap justify-center gap-3"
          role="group"
          aria-label="Listen to a note from the Soundie scale"
        >
          {NOTES.map((n) => {
            const isHovered = hovered === n.id
            const isPlaying = playingId === n.id
            const active = isHovered || isPlaying
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleSelect(n)}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(n.id)}
                onBlur={() => setHovered((cur) => (cur === n.id ? null : cur))}
                aria-pressed={isPlaying}
                aria-label={`Play ${n.name} (${n.freq.toFixed(2)} Hz)`}
                className="group relative flex flex-col items-center gap-1.5 rounded-2xl border px-4 py-3 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-pearl"
                style={{
                  borderColor: active ? n.hex : 'var(--pearl-border)',
                  backgroundColor: active
                    ? `color-mix(in srgb, ${n.hex} 8%, var(--pearl))`
                    : 'transparent',
                  boxShadow: isPlaying ? `0 8px 24px -12px ${n.hex}80` : 'none',
                }}
              >
                <NoteOrb note={n} hovered={isHovered} playing={isPlaying} reducedMotion={reducedMotion} />
                <span
                  className="font-mono text-[0.65rem] font-semibold tracking-wide transition-colors duration-300"
                  style={{ color: active ? n.hex : 'var(--ink-muted)' }}
                >
                  {n.id}
                </span>
                <span className="max-w-[5rem] text-center font-[family-name:var(--font-lora,serif)] text-[0.62rem] leading-tight text-ink-muted opacity-0 transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  {n.name}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-14 flex flex-col items-center gap-5">
          <Link
            href="/play"
            className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-coral px-8 py-4 font-mono text-sm font-semibold text-pearl shadow-md transition-all duration-200 hover:bg-coral-light hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-pearl"
          >
            Begin Session
          </Link>
          <p className="font-[family-name:var(--font-lora,serif)] text-xs italic text-ink-muted">
            C · The Foundation · 261.63 Hz
          </p>
        </div>

        <section
          className="mx-auto mt-24 grid max-w-md grid-cols-1 gap-5 sm:grid-cols-3"
          aria-label="How Soundie works"
        >
          {[
            { k: 'one',   t: 'Listen', d: 'Choose a note. Stay with it. The frequency does the rest.' },
            { k: 'two',   t: 'Grow',   d: 'Each session feeds your note. It deepens, slowly, like memory.' },
            { k: 'three', t: 'Reveal', d: 'Lore unlocks as time passes. The note tells you what it knows.' },
          ].map((s, i) => (
            <div
              key={s.k}
              className="rounded-xl border border-pearl-border/60 bg-pearl/60 px-4 py-4 backdrop-blur-sm"
            >
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-coral">
                Step {String(i + 1).padStart(2, '0')}
              </p>
              <p className="mt-1 font-[family-name:var(--font-fraunces,serif)] text-lg font-semibold text-ink">
                {s.t}
              </p>
              <p className="mt-1 font-[family-name:var(--font-lora,serif)] text-sm leading-relaxed text-ink-muted">
                {s.d}
              </p>
            </div>
          ))}
        </section>

        <p className="mx-auto mt-16 max-w-md text-center font-[family-name:var(--font-lora,serif)] text-sm italic leading-relaxed text-ink-muted">
          Soundie does not demand your attention. It rewards your stillness.
        </p>
      </main>

      <footer className="relative z-10 border-t border-pearl-border/40 px-6 py-7">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="font-mono text-[0.65rem] tracking-widest text-ink-muted uppercase">
            Soundie — it heals.
          </p>
          <p className="font-mono text-[0.6rem] text-ink-muted/70">
            © {new Date().getFullYear()} · Presence Pass
          </p>
        </div>
      </footer>

    </div>
  )
}
