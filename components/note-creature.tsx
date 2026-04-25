'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSoundieStore } from '@/lib/soundie-store'
import { getCaptionsForNote, getEmotionById, getLoreFragmentsForNote, getNoteById } from '@/lib/notes'
import { hexToRgba } from '@/lib/hex-rgba'
import { trpc } from '@/lib/trpc/react'
import { LockedNotes } from '@/components/locked-notes'
import {
  MAX_LORE_FRAGMENTS,
  loreUnlockStatusFromTotalListenSeconds,
  secondsRequiredForLoreFragment,
} from '@/lib/progress'
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'

interface AudioContextType {
  ctx: AudioContext | null
  oscillator: OscillatorNode | null
  gain: GainNode | null
  convolver: ConvolverNode | null
}

const LORE_STAGES = MAX_LORE_FRAGMENTS

export function NoteCreature() {
  const {
    activeNoteId,
    progress,
    currentSession,
    startSession,
    updateSessionElapsed,
    completeSession,
    stopSession,
  } = useSoundieStore()
  const noteQuery = trpc.note.getById.useQuery(
    { id: activeNoteId, locale: 'en' },
    { retry: false }
  )
  const syncFromRemote = useSoundieStore((s) => s.syncFromRemote)
  const playerId = useSoundieStore((s) => s.playerId)
  const teardropShelfOpen = useSoundieStore((s) => s.teardropShelfOpen)
  const setTeardropShelfOpen = useSoundieStore((s) => s.setTeardropShelfOpen)

  const sessionsQuery = trpc.soundie.getSessions.useQuery(
    { playerId: playerId!, noteId: activeNoteId },
    { enabled: !!playerId, staleTime: 10_000, retry: false },
  )
  const teardropPlaylistQuery = trpc.teardrop.getMappedForNote.useQuery(
    { noteId: activeNoteId, locale: 'pl' },
    { staleTime: 30_000, retry: false },
  )

  const { mutate: completeRemoteSession } = trpc.soundie.completeSession.useMutation({
    onSuccess: (result) => {
      const row = result.soundie
      syncFromRemote({
        totalListenTime: row.totalListenTime,
        level: row.level,
        loreUnlocked: row.loreUnlocked,
      })
      sessionsQuery.refetch()
    },
  })
  const fallbackDef = getNoteById(activeNoteId) ?? getNoteById('C')
  const def = noteQuery.data ?? fallbackDef
  const showNoteLoadError =
    noteQuery.isError && !noteQuery.data && !fallbackDef && !noteQuery.isFetching
  if (!def) return null
  const c = def.chromaHex
  const captions = useMemo(
    () => noteQuery.data?.captions?.map((f: { body: string }) => f.body) ?? getCaptionsForNote(activeNoteId),
    [noteQuery.data, activeNoteId],
  )
  const captionIndex = captions.length > 0
    ? Math.floor(currentSession.elapsed / 20) % captions.length
    : 0
  const activeCaption = captions[captionIndex] ?? null

  const emotion = getEmotionById(noteQuery.data?.emotionId ?? def.emotionId ?? '')
  const healingStyle = noteQuery.data?.healingStyle ?? def.healingStyle

  const healingChips: { label: string; key: string }[] = [
    ...(noteQuery.data?.emotionName
      ? [{ key: 'emotion', label: noteQuery.data.emotionName }]
      : emotion
        ? [{ key: 'emotion', label: emotion.namePl }]
        : []),
    ...(healingStyle ? [{ key: 'style', label: healingStyle }] : []),
  ]
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<AudioContextType>({
    ctx: null,
    oscillator: null,
    gain: null,
    convolver: null,
  })
  const animationRef = useRef<number | null>(null)
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const effectiveTotalListenTime =
    progress.totalListenTime + (currentSession.active ? currentSession.elapsed : 0)

  const loreFragments = noteQuery.data?.loreFragments ?? getLoreFragmentsForNote(activeNoteId)

  const loreStageTexts = useMemo(() => {
    const out = [...loreFragments]
    while (out.length < LORE_STAGES) out.push('')
    return out.slice(0, LORE_STAGES)
  }, [loreFragments])

  const [loreCarouselApi, setLoreCarouselApi] = useState<CarouselApi | null>(null)
  const [selectedLoreIndex, setSelectedLoreIndex] = useState(0)
  const [justUnlocked, setJustUnlocked] = useState<number | null>(null)
  const [selectedTeardropCardId, setSelectedTeardropCardId] = useState<string | null>(null)
  const loreStatus = useMemo(
    () => loreUnlockStatusFromTotalListenSeconds(effectiveTotalListenTime),
    [effectiveTotalListenTime]
  )
  const prevLoreRef = useRef(loreStatus.unlockedFragments)

  const loreStageUnlocked = (index: number) => index < loreStatus.unlockedFragments

  const selectedTeardropCard = useMemo(() => {
    const cards = teardropPlaylistQuery.data ?? []
    if (cards.length === 0 || !selectedTeardropCardId) return null
    return cards.find((card) => card.id === selectedTeardropCardId) ?? null
  }, [teardropPlaylistQuery.data, selectedTeardropCardId])

  const selectedTeardropTexts = useMemo(() => {
    if (!selectedTeardropCard) return { affirmation: '', description: '', tagline: '' }
    const pick = (field: string) =>
      selectedTeardropCard.texts.find((t) => t.field === field)?.content?.trim() ?? ''
    return {
      affirmation: pick('affirmation'),
      description: pick('description'),
      tagline: pick('tagline'),
    }
  }, [selectedTeardropCard])

  useEffect(() => {
    setSelectedTeardropCardId(null)
  }, [activeNoteId])

  const minutesToUnlockFragment = (index: number) => {
    const requiredSec = secondsRequiredForLoreFragment(index + 1)
    const remaining = Math.max(0, requiredSec - effectiveTotalListenTime)
    return Math.ceil(remaining / 60)
  }

  const loreXpPercent = loreStatus.progressWithinCurrentFragmentPercent
  const minutesToNextLore = Math.ceil(loreStatus.secondsToNextUnlock / 60)

  useEffect(() => {
    if (!loreCarouselApi) return
    const idx = Math.max(
      0,
      Math.min(LORE_STAGES - 1, loreStatus.unlockedFragments - 1)
    )
    queueMicrotask(() => loreCarouselApi.scrollTo(idx, true))
  }, [loreCarouselApi, activeNoteId, loreStatus.unlockedFragments])

  useEffect(() => {
    if (!loreCarouselApi) return
    const handleSelect = () => setSelectedLoreIndex(loreCarouselApi.selectedScrollSnap())
    handleSelect()
    loreCarouselApi.on('select', handleSelect)
    return () => {
      loreCarouselApi.off('select', handleSelect)
    }
  }, [loreCarouselApi])

  useEffect(() => {
    const prev = prevLoreRef.current
    if (loreStatus.unlockedFragments > prev) {
      const newIdx = loreStatus.unlockedFragments - 1
      setJustUnlocked(newIdx)
      setTimeout(() => setJustUnlocked(null), 3500)
      if (loreCarouselApi) {
        queueMicrotask(() => loreCarouselApi.scrollTo(newIdx))
      }
    }
    prevLoreRef.current = loreStatus.unlockedFragments
  }, [loreStatus.unlockedFragments, loreCarouselApi])

  // Initialize Web Audio
  useEffect(() => {
    const initAudio = async () => {
      if (audioRef.current.ctx) return

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create gain node for volume control
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 0.2 // Soft volume
      gainNode.connect(audioContext.destination)

      // Create convolver for subtle reverb
      const convolverNode = audioContext.createConvolver()
      convolverNode.connect(gainNode)

      // Create a simple impulse response for reverb
      const rate = audioContext.sampleRate
      const length = rate * 2 // 2 seconds of reverb
      const impulseResponse = audioContext.createBuffer(2, length, rate)
      const left = impulseResponse.getChannelData(0)
      const right = impulseResponse.getChannelData(1)

      for (let i = 0; i < length; i++) {
        left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2)
        right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2)
      }

      convolverNode.buffer = impulseResponse

      audioRef.current = {
        ctx: audioContext,
        oscillator: null,
        gain: gainNode,
        convolver: convolverNode,
      }
    }

    initAudio().catch(console.error)
  }, [])

  // Handle session timer
  useEffect(() => {
    if (!currentSession.active) {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current)
        sessionIntervalRef.current = null
      }
      return
    }

    sessionIntervalRef.current = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - currentSession.startedAt) / 1000)
      updateSessionElapsed(elapsed)

      if (elapsed >= currentSession.duration) {
        const credited = Math.min(elapsed, currentSession.duration)
        stopSession()
        completeSession()
        setIsPlaying(false)
        pauseAudio()
        const pid = useSoundieStore.getState().playerId
        const nid = useSoundieStore.getState().activeNoteId
        if (pid && credited > 0) {
          completeRemoteSession({
            playerId: pid,
            noteId: nid,
            durationSeconds: credited,
          })
        }
      }
    }, 100)

    return () => {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current)
        sessionIntervalRef.current = null
      }
    }
  }, [
    currentSession.active,
    currentSession.startedAt,
    currentSession.duration,
    updateSessionElapsed,
    stopSession,
    completeSession,
    completeRemoteSession,
  ])

  // Play/pause audio
  const toggleAudio = () => {
    if (isPlaying) {
      pauseAudio()
    } else {
      playAudio()
    }
  }

  const playAudio = () => {
    const ctx = audioRef.current.ctx
    if (!ctx) return

    // Resume context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    // Create new oscillator
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = def.frequency

    // Create envelope for smooth start
    const gain = audioRef.current.gain!
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.5)

    osc.connect(audioRef.current.convolver!)
    osc.start()

    audioRef.current.oscillator = osc
    setIsPlaying(true)

    if (!currentSession.active) {
      startSession()
    }
  }

  const pauseAudio = () => {
    const ctx = audioRef.current.ctx
    const osc = audioRef.current.oscillator

    if (osc && ctx) {
      const gain = audioRef.current.gain!
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)

      setTimeout(() => {
        osc.stop()
        audioRef.current.oscillator = null
      }, 300)
    }

    setIsPlaying(false)
  }

  useEffect(() => {
    const ctx = audioRef.current.ctx
    const osc = audioRef.current.oscillator
    if (osc && ctx) {
      osc.frequency.setValueAtTime(def.frequency, ctx.currentTime)
    }
  }, [def.frequency])

  // Breathing animation
  useEffect(() => {
    if (!isPlaying && !currentSession.active) return

    const animate = () => {
      // Creature scales up and down gently
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying, currentSession.active])

  const progressPercent = (currentSession.elapsed / currentSession.duration) * 100
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex w-full min-h-0 flex-1 flex-col items-center px-4 pb-8">
      {showNoteLoadError && (
        <p className="mb-4 mt-4 max-w-md text-center font-mono text-xs text-coral-dark">
          Could not load this note. Is the database set up?
        </p>
      )}

      <Suspense fallback={null}>
        <LockedNotes />
      </Suspense>

      <div className="mt-8 mb-6 text-center">
        {/* { <h3 className="text-creature-name mb-1" style={{ color: c }}>
          {def.name}
        </h3>}
        <p className="font-mono text-sm" style={{ color: c }}>
          {def.synestheticTitlePl}
        </p>
        <p className="font-mono text-xs text-ink-muted mt-1">{def.frequency} Hz</p> */}

        {activeCaption && (
          <p
            key={captionIndex}
            className="font-mono text-xs italic text-ink-muted mb-3 max-w-xs mx-auto leading-relaxed transition-opacity duration-700"
            style={{ color: hexToRgba(c, 0.7) }}
          >
            {activeCaption}
          </p>
        )}
      </div>

      <div className="w-full max-w-md flex flex-col gap-4">
        <div className="lore-card">
          <div className="mb-5 flex justify-center">
            <span
              className="h-12 w-12 rounded-full border-2 border-pearl bg-pearl shadow-sm"
              style={{ boxShadow: `0 0 0 4px ${hexToRgba(c, 0.2)}` }}
              aria-hidden
            >
              <span
                className="block h-full w-full rounded-full"
                style={{ backgroundColor: c }}
              />
            </span>
          </div>
          <div className="mb-6 text-center">
            <h2 className="text-lora text-lg font-semibold text-ink">{def.name}</h2>
            <p className="font-mono text-sm" style={{ color: c }}>
              {def.synestheticTitlePl} · {def.element}
            </p>
          </div>

          <div className="mb-6 space-y-4 text-center">
            <div>
              <p className="mb-1 font-mono text-xs text-ink-muted">Frequency</p>
              <p className="text-lora text-ink">{def.frequency} Hz</p>
            </div>
            {healingChips.length > 0 && (
              <div>
                <p className="mb-2 font-mono text-xs text-ink-muted">Supports</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {healingChips.map((chip) => (
                    <span
                      key={chip.key}
                      className="inline-flex items-center rounded-full border px-3 py-1 font-mono text-[0.65rem] tracking-wide lowercase"
                      style={{
                        borderColor: hexToRgba(c, 0.35),
                        color: c,
                        backgroundColor: hexToRgba(c, 0.07),
                      }}
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-3 font-mono text-xs text-ink-muted">Lore</p>
              <Carousel
                className="w-full"
                setApi={setLoreCarouselApi}
                opts={{ align: 'start', loop: false }}
              >
                <div className="mx-auto flex w-full items-center gap-1 sm:gap-2">
                  <CarouselPrevious
                    type="button"
                    variant="ghost"
                    className="!static !h-9 !w-9 shrink-0 !-translate-y-0 border-0 text-ink shadow-none focus-visible:ring-0"
                  />
                  <div className="min-w-0 flex-1 outline-none [box-shadow:none]">
                    <CarouselContent className="-ml-2 min-w-0 sm:-ml-3">
                      {loreStageTexts.map((text, i) => {
                        const open = loreStageUnlocked(i)
                        const isNew = justUnlocked === i
                        const minsLeft = minutesToUnlockFragment(i)
                        return (
                          <CarouselItem key={i} className="basis-full pl-2 sm:pl-3">
                            {open ? (
                              <div
                                className={cn(
                                  'text-center transition-opacity duration-300',
                                  selectedLoreIndex === i ? 'opacity-100' : 'opacity-45',
                                  isNew && 'lore-fragment-unlocked'
                                )}
                              >
                                {isNew && (
                                  <p className="mb-2 font-mono text-[0.65rem] font-semibold tracking-widest uppercase" style={{ color: c }}>
                                    Fragment unlocked
                                  </p>
                                )}
                                <p className="font-mono text-[0.65rem] text-ink-muted mb-2">
                                  {i + 1} / {LORE_STAGES}
                                </p>
                                <p className="text-lora mx-auto max-w-prose text-sm italic text-ink leading-relaxed">
                                  &ldquo;{text}&rdquo;
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 py-2 text-center opacity-50">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted">
                                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                                <p className="font-mono text-[0.65rem] text-ink-muted">
                                  {i + 1} / {LORE_STAGES}
                                </p>
                                <p className="font-mono text-[0.65rem] text-ink-muted">
                                  ~{minsLeft} min to unlock
                                </p>
                              </div>
                            )}
                          </CarouselItem>
                        )
                      })}
                    </CarouselContent>
                  </div>
                  <CarouselNext
                    type="button"
                    variant="ghost"
                    className="!static !h-9 !w-9 shrink-0 !-translate-y-0 border-0 text-ink shadow-none focus-visible:ring-0"
                  />
                </div>
              </Carousel>
              {teardropPlaylistQuery.data && teardropPlaylistQuery.data.length > 0 && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setTeardropShelfOpen(!teardropShelfOpen)}
                    className="font-mono text-[0.65rem] text-ink-muted underline-offset-4 hover:underline"
                    aria-expanded={teardropShelfOpen}
                  >
                    {teardropShelfOpen ? 'close teardrop shelf' : 'open teardrop shelf'}
                  </button>
                  <div
                    className={cn(
                      'grid transition-all duration-500 ease-out',
                      teardropShelfOpen
                        ? 'mt-3 grid-rows-[1fr] opacity-100'
                        : 'mt-0 grid-rows-[0fr] opacity-0',
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="flex flex-wrap justify-center gap-2">
                        {teardropPlaylistQuery.data.slice(0, 5).map((card, idx) => (
                          <button
                            type="button"
                            key={card.id}
                            onClick={() => setSelectedTeardropCardId(card.id)}
                            className="inline-flex items-center rounded-full border px-3 py-1 font-mono text-[0.62rem] lowercase tracking-wide transition-all duration-200"
                            style={{
                              borderColor:
                                selectedTeardropCard?.id === card.id
                                  ? hexToRgba(c, 0.65)
                                  : hexToRgba(c, 0.35),
                              color: c,
                              backgroundColor:
                                selectedTeardropCard?.id === card.id
                                  ? hexToRgba(c, 0.15)
                                  : hexToRgba(c, 0.06),
                            }}
                          >
                            {idx + 1}. {card.name}
                          </button>
                        ))}
                      </div>
                      {selectedTeardropCard && (
                        <div
                          className="mt-4 rounded-xl border px-4 py-3 text-left"
                          style={{
                            borderColor: hexToRgba(c, 0.25),
                            backgroundColor: hexToRgba(c, 0.04),
                          }}
                        >
                          <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-muted">
                            teardrop · {selectedTeardropCard.name}
                          </p>
                          {selectedTeardropTexts.affirmation && (
                            <p className="mt-2 text-lora text-sm italic leading-relaxed text-ink">
                              &ldquo;{selectedTeardropTexts.affirmation}&rdquo;
                            </p>
                          )}
                          {!selectedTeardropTexts.affirmation && selectedTeardropTexts.tagline && (
                            <p className="mt-2 text-lora text-sm italic leading-relaxed text-ink">
                              &ldquo;{selectedTeardropTexts.tagline}&rdquo;
                            </p>
                          )}
                          {selectedTeardropTexts.description && (
                            <p className="mt-2 font-mono text-[0.68rem] leading-relaxed text-ink-muted">
                              {selectedTeardropTexts.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          <div className="border-t border-pearl-border pt-5 text-center">
            <p className="font-mono text-xs text-ink-muted mb-3">Listening Session</p>
            <button
              onClick={toggleAudio}
              className={`
                w-full rounded-full px-8 py-3 font-mono text-sm font-semibold
                transition-all duration-200 shadow-md
                ${isPlaying
                  ? 'bg-coral-dark text-pearl hover:bg-coral'
                  : 'bg-coral text-pearl hover:bg-coral-light'}
              `}
            >
              {isPlaying ? 'Stop Listening' : 'Begin Session'}
            </button>

            {currentSession.active && (
              <div className="mt-3">
                <div className="bg-pearl rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full transition-all duration-100"
                    style={{ width: `${progressPercent}%`, backgroundColor: c }}
                  />
                </div>
                <p className="text-xs text-ink-muted text-center mt-2 font-mono">
                  {formatTime(currentSession.elapsed)} / {formatTime(currentSession.duration)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-pearl-border bg-pearl-dark px-6 py-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-xs text-ink-muted">Journey</p>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-pearl px-3 py-2 text-center">
              <p className="font-mono text-lg font-bold text-ink">
                {sessionsQuery.data?.totalCount ?? '—'}
              </p>
              <p className="font-mono text-[0.6rem] text-ink-muted mt-0.5">sessions</p>
            </div>
            <div className="rounded-xl bg-pearl px-3 py-2 text-center">
              <p className="font-mono text-lg font-bold text-ink">
                {sessionsQuery.data
                  ? `${Math.floor(sessionsQuery.data.totalSeconds / 60)}m`
                  : '—'}
              </p>
              <p className="font-mono text-[0.6rem] text-ink-muted mt-0.5">total listened</p>
            </div>
          </div>

          {sessionsQuery.data && sessionsQuery.data.sessions.length > 0 && (
            <div className="mb-3 space-y-1">
              {sessionsQuery.data.sessions.slice(0, 3).map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <p className="font-mono text-[0.65rem] text-ink-muted">
                    {new Date(s.completedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="font-mono text-[0.65rem] text-ink-muted">
                    +{Math.floor(s.duration / 60)}m {s.duration % 60}s
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// CSS animation
if (typeof window !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `
  document.head.appendChild(style)
}
