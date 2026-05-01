'use client'

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { NOTE_LIST, getNoteById, HEALING_STYLE_LABEL } from '@/lib/notes'
import { hexToRgba } from '@/lib/hex-rgba'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { getChordPreset, CHORD_PRESETS } from '@/lib/chord-presets'
import { getTeardropLoreForChordNotes } from '@/lib/teardrop-chord-lore'

// ── Harmony detection ────────────────────────────────────────────────────────

const NOTE_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5,
  'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
}

// Score 1 (very consonant) → 0 (dissonant) per interval
const INTERVAL_SCORE: Record<number, number> = {
  0: 1.0,  // unison
  12: 1.0, // octave
  7: 0.9,  // perfect fifth
  5: 0.85, // perfect fourth
  4: 0.8,  // major third
  3: 0.75, // minor third
  9: 0.7,  // major sixth
  8: 0.65, // minor sixth
  2: 0.4,  // major second
  10: 0.4, // minor seventh
  11: 0.2, // major seventh
  1: 0.1,  // minor second
  6: 0.05, // tritone
}

function getInterval(a: string, b: string): number {
  const sa = NOTE_SEMITONE[a] ?? 0
  const sb = NOTE_SEMITONE[b] ?? 0
  const diff = Math.abs(sa - sb) % 12
  return diff
}

/** Seeded `quality` on ChordPreset → same vocabulary as note healing styles */
function seedQualityLabel(quality: string, locale: 'pl' | 'en'): string {
  const row = HEALING_STYLE_LABEL[quality]
  if (row) return locale === 'pl' ? row.pl : row.en
  return quality
}

function splitTeardropMeaningLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function computeHarmony(noteIds: string[]): { score: number; label: string; labelPl: string } {
  if (noteIds.length < 2) return { score: 1, label: 'single tone', labelPl: 'pojedynczy ton' }

  let total = 0
  let count = 0
  for (let i = 0; i < noteIds.length; i++) {
    for (let j = i + 1; j < noteIds.length; j++) {
      const interval = getInterval(noteIds[i]!, noteIds[j]!)
      total += INTERVAL_SCORE[interval] ?? 0.3
      count++
    }
  }
  const score = total / Math.max(count, 1)

  let label: string
  let labelPl: string
  if (score >= 0.85) { label = 'harmonious'; labelPl = 'harmonia' }
  else if (score >= 0.65) { label = 'warm tension'; labelPl = 'ciepłe napięcie' }
  else if (score >= 0.45) { label = 'open'; labelPl = 'otwarty' }
  else if (score >= 0.25) { label = 'tension'; labelPl = 'napięcie' }
  else { label = 'dissonant'; labelPl = 'dysonans' }

  return { score, label, labelPl }
}

// ── Audio engine ─────────────────────────────────────────────────────────────

interface VoiceNode {
  osc: OscillatorNode
  pre: GainNode
}

interface AudioEngine {
  ctx: AudioContext
  master: GainNode
  convolver: ConvolverNode
  voices: Map<string, VoiceNode>
}

function buildImpulse(ctx: AudioContext): AudioBuffer {
  const rate = ctx.sampleRate
  const length = rate * 2
  const buf = ctx.createBuffer(2, length, rate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.2)
    }
  }
  return buf
}

function createEngine(): AudioEngine {
  const AudioContextClass: typeof AudioContext =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new AudioContextClass()

  const master = ctx.createGain()
  master.gain.value = 0.22
  master.connect(ctx.destination)

  const convolver = ctx.createConvolver()
  convolver.buffer = buildImpulse(ctx)
  convolver.connect(master)

  return { ctx, master, convolver, voices: new Map() }
}

function playChord(engine: AudioEngine, noteIds: string[]) {
  // Stop any currently playing voices first
  stopChord(engine)

  const { ctx, convolver } = engine
  // All voices start at same scheduled time → perfect sync
  const startAt = ctx.currentTime + 0.06

  for (const id of noteIds) {
    const def = getNoteById(id)
    if (!def) continue

    const pre = ctx.createGain()
    pre.gain.setValueAtTime(0, startAt)
    pre.gain.linearRampToValueAtTime(0.6, startAt + 0.08)
    pre.connect(convolver)

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = def.frequency
    osc.connect(pre)
    osc.start(startAt)

    engine.voices.set(id, { osc, pre })
  }
}

function stopChord(engine: AudioEngine) {
  const { ctx, voices } = engine
  const now = ctx.currentTime
  for (const { osc, pre } of voices.values()) {
    pre.gain.setValueAtTime(pre.gain.value, now)
    pre.gain.linearRampToValueAtTime(0, now + 0.25)
    setTimeout(() => {
      try { osc.stop() } catch { /* already stopped */ }
    }, 300)
  }
  voices.clear()
}

// ── Component ─────────────────────────────────────────────────────────────────

const MAX_CHORD_SIZE = 5

interface Props {
  locale?: 'en' | 'pl'
  className?: string
}

/** Chord builder is local state only — unrelated to URL / `?note=` / search params. */
export function ChordSequencer({ locale = 'pl', className }: Props) {
  const t = useTranslations('noteCreature')
  const engineRef = useRef<AudioEngine | null>(null)

  const [selected, setSelected] = useState<string[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [pulseKey, setPulseKey] = useState(0) // triggers CSS pulse when chord plays

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        stopChord(engineRef.current)
        try { engineRef.current.ctx.close() } catch { /* noop */ }
        engineRef.current = null
      }
    }
  }, [])

  const ensureEngine = useCallback(async () => {
    if (!engineRef.current) {
      engineRef.current = createEngine()
    }
    if (engineRef.current.ctx.state === 'suspended') {
      await engineRef.current.ctx.resume()
    }
    return engineRef.current
  }, [])

  const handlePlay = useCallback(async () => {
    if (selected.length === 0) return
    const engine = await ensureEngine()
    playChord(engine, selected)
    setIsPlaying(true)
    setPulseKey((k) => k + 1)
  }, [selected, ensureEngine])

  const handleStop = useCallback(() => {
    if (engineRef.current) stopChord(engineRef.current)
    setIsPlaying(false)
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) handleStop()
    else void handlePlay()
  }, [isPlaying, handlePlay, handleStop])

  const addNote = useCallback((id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((n) => n !== id)
      if (prev.length >= MAX_CHORD_SIZE) return prev
      return [...prev, id]
    })
    // If playing, retrigger
    if (isPlaying) void handlePlay()
  }, [isPlaying, handlePlay])

  const removeNote = useCallback((id: string) => {
    setSelected((prev) => prev.filter((n) => n !== id))
    if (isPlaying) void handlePlay()
  }, [isPlaying, handlePlay])

  const clearChord = useCallback(() => {
    handleStop()
    setSelected([])
  }, [handleStop])

  const harmony = computeHarmony(selected)
  const harmonyLabel = locale === 'pl' ? harmony.labelPl : harmony.label
  const harmonyColor = harmony.score >= 0.8
    ? '#4ade80'
    : harmony.score >= 0.5
      ? '#fbbf24'
      : '#f87171'

  // Matched named preset for the current selection
  const matchedPreset = useMemo(
    () => (selected.length >= 2 ? getChordPreset(selected) : undefined),
    [selected],
  )

  const teardropLore = useMemo(
    () => (matchedPreset ? getTeardropLoreForChordNotes(matchedPreset.noteIds, locale) : null),
    [matchedPreset, locale],
  )

  // Suggested next-note additions: presets that contain all current notes + 1 more
  const suggestions = useMemo(() => {
    if (selected.length === 0 || selected.length >= MAX_CHORD_SIZE) return []
    const selSet = new Set(selected)
    return CHORD_PRESETS.filter((p) => {
      if (p.noteIds.length !== selected.length + 1) return false
      return selected.every((id) => p.noteIds.includes(id))
    }).slice(0, 3)
  }, [selected])

  /** W nagłówku / karcie: przy rozpoznanym zapisie z seeda pokazujemy `quality`, nie heurystykę interwałów */
  const facetLabel =
    matchedPreset != null
      ? seedQualityLabel(matchedPreset.quality, locale)
      : harmonyLabel

  const facetColor =
    matchedPreset != null
      ? 'rgb(71 85 105)' // slate-600 — neutral, „zapis”, nie „analiza harmoniczna”
      : harmonyColor

  return (
    <div className={cn('w-full select-none', className)}>
      {/* Header */}
      <div className="mb-4">
        <p className="font-mono text-[0.5rem] uppercase tracking-[0.24em] text-ink-muted">
          {t('chordSequencer.kicker')}
        </p>
        <h3 className="mt-0.5 font-[family-name:var(--font-fraunces,serif)] text-lg font-semibold tracking-tight text-ink">
          {t('chordSequencer.title')}
        </h3>
        <p className="mt-1 font-body-serif text-[0.75rem] italic text-ink/55">
          {t('chordSequencer.subtitle')}
        </p>
      </div>

      {/* Chord slots */}
      <div className="mb-4">
        <p className="mb-2 font-mono text-[0.48rem] uppercase tracking-[0.2em] text-ink-muted/65">
          {t('chordSequencer.chordLabel')}
          {selected.length >= 2 && (
            <span className="ml-2 normal-case" style={{ color: facetColor }}>
              · {facetLabel}
            </span>
          )}
        </p>

        {selected.length === 0 ? (
          <p className="font-body-serif text-sm italic text-ink/35">{t('chordSequencer.emptyChord')}</p>
        ) : (
          <div className="space-y-1.5">
            {selected.map((id, idx) => {
              const def = getNoteById(id)
              if (!def) return null
              const displayName = locale === 'pl' ? def.synestheticTitlePl : def.name
              const caption =
                locale === 'pl' ? def.synestheticLinePl : (def.captions[0] ?? def.healing)
              return (
                <div
                  key={id}
                  className={cn(
                    'flex items-start gap-3 overflow-hidden rounded-2xl border border-pearl-border/40 bg-white/60 px-3 py-2.5 backdrop-blur-sm transition-shadow duration-300',
                    isPlaying && 'shadow-[0_0_18px_-4px_var(--chord-glow)]',
                  )}
                  style={{
                    // @ts-expect-error css var
                    '--chord-glow': hexToRgba(def.chromaHex, 0.45),
                    animationDelay: `${idx * 120}ms`,
                  }}
                >
                  {/* Color badge */}
                  <div
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-[0.6rem] font-bold text-white shadow-sm"
                    style={{ backgroundColor: def.chromaHex }}
                  >
                    {def.short}
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[0.65rem] font-semibold leading-snug text-ink">
                      {displayName}
                    </p>
                    {caption && (
                      <p className="mt-0.5 line-clamp-2 font-body-serif text-[0.7rem] italic leading-snug text-ink/55">
                        {caption}
                      </p>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    aria-label={`Remove ${def.short}`}
                    onClick={() => removeNote(id)}
                    className="mt-0.5 shrink-0 font-mono text-[0.7rem] text-ink/30 transition-colors hover:text-ink/70"
                  >
                    ×
                  </button>
                </div>
              )
            })}
            {selected.length < MAX_CHORD_SIZE && (
              <p className="pl-1 font-mono text-[0.5rem] text-ink/25">
                +{MAX_CHORD_SIZE - selected.length} {t('chordSequencer.slotsLeft')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Note palette */}
      <div className="mb-5">
        <p className="mb-2.5 font-mono text-[0.48rem] uppercase tracking-[0.2em] text-ink-muted/65">
          {t('chordSequencer.paletteLabel')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {NOTE_LIST.map((note) => {
            const inChord = selected.includes(note.id)
            const disabled = !inChord && selected.length >= MAX_CHORD_SIZE
            return (
              <button
                key={note.id}
                type="button"
                disabled={disabled}
                onClick={() => addNote(note.id)}
                title={locale === 'pl' ? note.synestheticTitlePl : note.name}
                className={cn(
                  'flex h-9 w-9 flex-col items-center justify-center rounded-xl border font-mono text-[0.6rem] font-semibold transition-all duration-200',
                  inChord
                    ? 'scale-105 text-white shadow-md'
                    : disabled
                      ? 'cursor-not-allowed border-pearl-border/25 text-ink/20'
                      : 'border-pearl-border/50 text-ink/70 hover:border-pearl-border hover:scale-105 hover:text-ink',
                )}
                style={inChord ? { backgroundColor: note.chromaHex, borderColor: 'transparent' } : {}}
              >
                <span>{note.short}</span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 font-mono text-[0.48rem] uppercase tracking-[0.14em] text-ink-muted/40">
          {t('chordSequencer.paletteHint')}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={togglePlay}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 font-mono text-sm font-semibold transition-all duration-300',
            selected.length === 0
              ? 'cursor-not-allowed bg-pearl-border/40 text-ink/30'
              : isPlaying
                ? 'bg-ink/12 text-ink shadow-inner ring-1 ring-ink/15'
                : 'bg-ink text-pearl hover:bg-ink/85 shadow-[0_4px_20px_-6px_rgba(15,23,42,0.35)]',
          )}
        >
          <span className="text-base leading-none">{isPlaying ? '◼' : '▶'}</span>
          <span>{isPlaying ? t('chordSequencer.stop') : t('chordSequencer.play')}</span>
          {selected.length > 1 && (
            <span className="opacity-55">
              · {selected.length} {t('chordSequencer.voices')}
            </span>
          )}
        </button>

        {selected.length > 0 && (
          <button
            type="button"
            onClick={clearChord}
            className="rounded-full border border-pearl-border/50 px-4 py-3.5 font-mono text-[0.65rem] text-ink/50 transition-colors hover:border-pearl-border hover:text-ink/80"
          >
            {t('chordSequencer.clear')}
          </button>
        )}
      </div>

      {/* Sync indicator when playing */}
      {isPlaying && selected.length > 1 && (
        <div className="mt-3 flex items-center gap-1.5">
          {selected.map((id) => {
            const def = getNoteById(id)
            return (
              <div
                key={id}
                className="h-0.5 flex-1 rounded-full animate-pulse"
                style={{ backgroundColor: def?.chromaHex ?? '#999', animationDelay: `${Math.random() * 0.5}s` }}
              />
            )
          })}
        </div>
      )}

      {/* Named preset — revealed when the combination is recognized */}
      {matchedPreset ? (
        <div
          className="mt-4 overflow-hidden rounded-2xl border border-pearl-border/40 bg-white/70 px-4 py-3.5 shadow-[0_4px_20px_-10px_rgba(15,23,42,0.12)] backdrop-blur-sm transition-all duration-500"
        >
          <p className="font-mono text-[0.45rem] uppercase tracking-[0.26em] text-ink-muted/60">
            {t('chordSequencer.presetRecognized')}
          </p>
          <p className="mt-1 font-[family-name:var(--font-fraunces,serif)] text-base font-semibold leading-snug text-ink">
            {locale === 'pl' ? matchedPreset.namePl : matchedPreset.nameEn}
          </p>
          <p className="mt-1.5 font-body-serif text-[0.73rem] italic leading-relaxed text-ink/60">
            {locale === 'pl' ? matchedPreset.descriptionPl : matchedPreset.descriptionEn}
          </p>

          {teardropLore && (
            <div className="mt-3 border-t border-pearl-border/35 pt-3">
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                <div>
                  <p className="font-mono text-[0.48rem] uppercase tracking-[0.2em] text-amber-800/75">
                    {t('chordSequencer.teardropInLight')}
                  </p>
                  <ul className="mt-1.5 list-none space-y-1 font-body-serif text-[0.72rem] leading-relaxed text-ink/80">
                    {splitTeardropMeaningLines(teardropLore.light).map((line, idx) => (
                      <li
                        key={`light-${idx}`}
                        className="relative pl-3 before:absolute before:left-0 before:top-[0.55em] before:h-px before:w-1.5 before:bg-amber-700/35"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-mono text-[0.48rem] uppercase tracking-[0.2em] text-ink/48">
                    {t('chordSequencer.teardropInShadow')}
                  </p>
                  <ul className="mt-1.5 list-none space-y-1 font-body-serif text-[0.72rem] leading-relaxed text-ink/72">
                    {splitTeardropMeaningLines(teardropLore.shadow).map((line, idx) => (
                      <li
                        key={`shadow-${idx}`}
                        className="relative pl-3 before:absolute before:left-0 before:top-[0.55em] before:h-px before:w-1.5 before:bg-ink/25"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: facetColor }} />
            <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-ink/45">
              {t('chordSequencer.seedQuality')}
              {': '}
              <span className="normal-case tracking-normal text-ink/70">{facetLabel}</span>
            </span>
            <span className="font-mono text-[0.5rem] tabular-nums tracking-[0.12em] text-ink-muted/55">
              {matchedPreset.noteIds.map((id) => getNoteById(id)?.short ?? id).join(' + ')}
            </span>
          </div>
        </div>
      ) : selected.length >= 2 ? (
        /* Harmony indicator when no named preset */
        <div className="mt-3 flex items-center justify-between rounded-xl border border-pearl-border/30 bg-pearl-dark/15 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: harmonyColor }} />
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-ink/60">
              {harmonyLabel}
            </span>
          </div>
          <span className="font-mono text-[0.55rem] tabular-nums text-ink-muted/50">
            {selected.map((id) => getNoteById(id)?.short ?? id).join(' + ')}
          </span>
        </div>
      ) : null}

      {/* Suggested next notes to complete a named preset */}
      {suggestions.length > 0 && !matchedPreset && (
        <div className="mt-3">
          <p className="mb-1.5 font-mono text-[0.45rem] uppercase tracking-[0.2em] text-ink-muted/50">
            {t('chordSequencer.suggestions')}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((preset) => {
              const nextNote = preset.noteIds.find((id) => !selected.includes(id))
              if (!nextNote) return null
              const def = getNoteById(nextNote)
              if (!def) return null
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => addNote(nextNote)}
                  className="flex items-center gap-1.5 rounded-full border border-pearl-border/50 bg-white/60 px-2.5 py-1.5 text-left transition-all hover:border-pearl-border hover:bg-white"
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[0.5rem] font-bold text-white"
                    style={{ backgroundColor: def.chromaHex }}
                  >
                    {def.short}
                  </span>
                  <span className="font-mono text-[0.55rem] text-ink/70">
                    + {def.short}
                    <span className="ml-1 text-ink/40">
                      → {locale === 'pl' ? preset.namePl : preset.nameEn}
                    </span>
                    <span className="ml-1 text-ink/35">
                      · {seedQualityLabel(preset.quality, locale)}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
