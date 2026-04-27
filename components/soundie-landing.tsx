'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { DEFAULT_NOTE_ID, NOTE_LIST, urlKeyForNoteId } from '@/lib/notes'
import { trpc } from '@/lib/trpc/react'

type LandingNote = {
  id: string
  freq: number
  hex: string
  name: string
}

const DIATONIC = new Set(['C', 'D', 'E', 'F', 'G', 'A', 'B'])

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
        try {
          oscRef.stop()
        } catch {}
      }, fadeOut * 1000 + 30)
    }
    refs.current.osc = null
    setPlayingId(null)
  }, [])

  const play = useCallback(
    (note: LandingNote) => {
      if (typeof window === 'undefined') return
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
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
        try {
          osc.stop()
        } catch {}
        refs.current.osc = null
        setPlayingId((cur) => (cur === note.id ? null : cur))
      }, PREVIEW_SECONDS * 1000 + 50)
    },
    [stop],
  )

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
  const t = useTranslations('landing')
  const locale = useLocale() as 'en' | 'pl'
  const lines = t.raw('lines') as string[]
  const freqs = useMemo(() => NOTE_LIST.map((e) => e.frequency), [])
  const freqLabel = useMemo(() => {
    const min = Math.min(...freqs)
    const max = Math.max(...freqs)
    const d = (n: number) =>
      n.toLocaleString(locale === 'pl' ? 'pl-PL' : 'en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })
    return t('freqRange', { min: d(min), max: d(max) })
  }, [freqs, t, locale])
  const notes: LandingNote[] = useMemo(
    () =>
      NOTE_LIST.map((e) => ({
        id: e.id,
        freq: e.frequency,
        hex: e.chromaHex,
        name: DIATONIC.has(e.id)
          ? t(
              `noteNames.${e.id}` as
                | 'noteNames.C'
                | 'noteNames.D'
                | 'noteNames.E'
                | 'noteNames.F'
                | 'noteNames.G'
                | 'noteNames.A'
                | 'noteNames.B',
            )
          : locale === 'pl'
            ? e.synestheticTitlePl
            : e.name,
      })),
    [t, locale],
  )
  const reducedMotion = usePrefersReducedMotion()
  const { play, stop, playingId } = useNotePreview()
  const [hovered, setHovered] = useState<string | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const focusedNote = notes.find((n) => n.id === (playingId ?? hovered)) ?? null
  const { line, fade } = useCycledLine(lines, 3800, reducedMotion)
  const selectedOrFallback = selectedNoteId ?? focusedNote?.id ?? DEFAULT_NOTE_ID
  const playHref = useMemo(
    () => `/play?note=${encodeURIComponent(urlKeyForNoteId(selectedOrFallback))}`,
    [selectedOrFallback],
  )
  const inviteCardQuery = trpc.teardrop.getMappedForNote.useQuery(
    { noteId: selectedOrFallback, locale },
    { staleTime: 60_000, retry: false },
  )
  const inviteCard = inviteCardQuery.data?.cards?.[0] ?? null
  const inviteTagline = inviteCard?.texts.find((x) => x.field === 'tagline')?.content?.trim() ?? ''
  const inviteAffirmation =
    inviteCard?.texts.find((x) => x.field === 'affirmation')?.content?.trim() ?? ''

  const handleSelect = useCallback(
    (note: LandingNote) => {
      setSelectedNoteId(note.id)
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
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden transition-colors duration-1000"
      style={{
        backgroundColor: focusedNote
          ? `color-mix(in srgb, ${focusedNote.hex} 6%, var(--pearl))`
          : 'var(--pearl)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {notes.map((n, i) => (
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

      <main className="relative z-10 mx-auto max-w-xl px-6 pb-24 pt-12 sm:pt-16">
        <p className="mb-6 text-center font-mono text-[0.65rem] text-ink-muted sm:text-xs">{freqLabel}</p>
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
          {t('headlineLine1')}
          <br />
          {t('headlineLine2')}
        </h1>

        <p className="mt-6 text-center font-[family-name:var(--font-lora,serif)] text-base leading-relaxed text-ink-muted">
          {t('subhead')}
        </p>

        <div className="mx-auto mt-5 flex max-w-md flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-pearl-border/70 bg-pearl/70 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-muted">
            {t('relief1')}
          </span>
          <span className="rounded-full border border-pearl-border/70 bg-pearl/70 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-muted">
            {t('relief2')}
          </span>
          <span className="rounded-full border border-pearl-border/70 bg-pearl/70 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-muted">
            {t('relief3')}
          </span>
        </div>

        <p className="mt-10 text-center font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-muted">
          {t('tapHint')}
        </p>

        <div
          className="mt-6 grid w-full max-w-4xl grid-cols-2 justify-items-stretch gap-3 sm:grid-cols-3 md:grid-cols-6"
          role="group"
          aria-label={t('ariaNoteGroup')}
        >
          {notes.map((n) => {
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
                aria-label={t('playAria', { name: n.name, freq: n.freq.toFixed(2) })}
                className="group relative flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-pearl"
                style={{
                  borderColor: active ? n.hex : 'var(--pearl-border)',
                  backgroundColor: active
                    ? `color-mix(in srgb, ${n.hex} 8%, var(--pearl))`
                    : 'transparent',
                  boxShadow: isPlaying ? `0 8px 24px -12px ${n.hex}80` : 'none',
                }}
              >
                <NoteOrb
                  note={n}
                  hovered={isHovered}
                  playing={isPlaying}
                  reducedMotion={reducedMotion}
                />
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

        <div className="mt-10 flex flex-col items-center gap-5">
          <section className="w-full max-w-md rounded-2xl border border-pearl-border/60 bg-pearl/70 p-5 text-left shadow-sm backdrop-blur-sm">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-coral">
              {t('inviteKicker')}
            </p>
            <p className="mt-2 font-[family-name:var(--font-fraunces,serif)] text-xl text-ink">
              {inviteCard?.name ?? t('inviteFallbackTitle')}
            </p>
            <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-wide text-ink-muted">
              {inviteTagline || t('inviteFallbackTagline')}
            </p>
            <p className="mt-3 font-[family-name:var(--font-lora,serif)] text-sm italic leading-relaxed text-ink/85">
              {inviteAffirmation || t('inviteFallbackAffirmation')}
            </p>
            <div className="mt-4">
              <Link
                href={playHref}
                className="inline-flex items-center justify-center rounded-full border border-coral/40 px-4 py-2 font-mono text-[0.68rem] uppercase tracking-wide text-coral transition-colors hover:bg-coral/10"
              >
                {t('inviteCta')}
              </Link>
            </div>
            <p className="mt-3 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-muted/80">
              {t('quickStart')}
            </p>
          </section>
        </div>

        <section className="mx-auto mt-20 max-w-xl space-y-10 border-t border-pearl-border/50 pt-12 text-left">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-coral">
              {t('narrativeWhatKicker')}
            </p>
            <p className="mt-3 font-[family-name:var(--font-lora,serif)] text-base leading-relaxed text-ink">
              {t('narrativeWhatP1')}
            </p>
            <p className="mt-3 font-[family-name:var(--font-lora,serif)] text-base leading-relaxed text-ink/90">
              {t('narrativeWhatP2')}
            </p>
            <p className="mt-3 font-[family-name:var(--font-lora,serif)] text-base leading-relaxed text-ink/90">
              {t('narrativeWhatP3')}
            </p>
          </div>

          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-coral">
              {t('narrativeHowKicker')}
            </p>
            <div className="mt-4 rounded-xl border border-pearl-border/80 bg-pearl/60 px-4 py-3 font-mono text-[0.72rem] leading-relaxed text-ink/90">
              {t('narrativeHowFlow')}
            </div>
            <p className="mt-4 font-[family-name:var(--font-lora,serif)] text-sm text-ink/85">
              {t('narrativeHowIntro')}
            </p>
            <ul className="mt-3 space-y-2.5 font-[family-name:var(--font-lora,serif)] text-sm leading-relaxed text-ink/85">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-coral" aria-hidden />
                <span>{t('narrativeHowBullet1')}</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-coral" aria-hidden />
                <span>{t('narrativeHowBullet2')}</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-coral" aria-hidden />
                <span>{t('narrativeHowBullet3')}</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-coral" aria-hidden />
                <span>{t('narrativeHowBullet4')}</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-coral" aria-hidden />
                <span>{t('narrativeHowBullet5')}</span>
              </li>
            </ul>
            <p className="mt-4 font-[family-name:var(--font-lora,serif)] text-sm italic text-ink-muted">
              {t('narrativeHowClosing')}
            </p>
          </div>

          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-coral">
              {t('narrativeTeardropKicker')}
            </p>
            <div className="mt-4 rounded-xl border border-pearl-border/80 bg-pearl/60 px-4 py-3 font-mono text-[0.68rem] leading-relaxed text-ink/90">
              {t('narrativeTeardropPhases')}
            </div>
            <p className="mt-4 font-[family-name:var(--font-lora,serif)] text-sm leading-relaxed text-ink/85">
              {t('narrativeTeardropP1')}
            </p>
            <p className="mt-3 font-[family-name:var(--font-lora,serif)] text-sm leading-relaxed text-ink/85">
              {t('narrativeTeardropP2')}
            </p>
          </div>

          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-coral">
              {t('narrativeDifferentKicker')}
            </p>
            <blockquote className="mt-4 border-l-4 border-coral/70 pl-4 font-[family-name:var(--font-lora,serif)] text-base italic leading-relaxed text-ink">
              {t('narrativeDifferentQuote')}
            </blockquote>
            <ul className="mt-4 space-y-2 font-mono text-[0.68rem] leading-relaxed text-ink-muted">
              <li>{t('narrativeDifferent1')}</li>
              <li>{t('narrativeDifferent2')}</li>
              <li>{t('narrativeDifferent3')}</li>
              <li>{t('narrativeDifferent4')}</li>
            </ul>
            <p className="mt-4 font-[family-name:var(--font-lora,serif)] text-sm leading-relaxed text-ink/85">
              {t('narrativeDifferentClosing')}
            </p>
          </div>

          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-coral">
              {t('narrativeWorldKicker')}
            </p>
            <p className="mt-3 font-[family-name:var(--font-lora,serif)] text-sm leading-relaxed text-ink/85">
              {t('narrativeWorldP1')}
            </p>
            <p className="mt-3 font-[family-name:var(--font-lora,serif)] text-sm leading-relaxed text-ink/85">
              {t('narrativeWorldP2')}
            </p>
            <p className="mt-3 font-[family-name:var(--font-lora,serif)] text-sm leading-relaxed text-ink/85">
              {t('narrativeWorldP3')}
            </p>
          </div>
        </section>

        <div className="mx-auto mt-16 max-w-md space-y-4 text-center">
          <p className="font-[family-name:var(--font-lora,serif)] text-sm italic leading-relaxed text-ink-muted">
            {t('closing')}
          </p>
          <p className="font-mono text-[0.6rem] leading-relaxed text-ink-muted/80">{t('narrativeStack')}</p>
          <p className="font-[family-name:var(--font-fraunces,serif)] text-lg text-coral">{t('narrativeSignoff')}</p>
        </div>
      </main>

      <footer className="relative z-10 border-t border-pearl-border/40 px-6 py-7">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="font-mono text-[0.65rem] tracking-widest text-ink-muted uppercase">
            {t('footerTagline')}
          </p>
          <p className="font-mono text-[0.6rem] text-ink-muted/70">
            {t('footerCopyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  )
}
