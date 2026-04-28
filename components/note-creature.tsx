'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { EMPTY_NOTE_PROGRESS, useSoundieStore } from '@/lib/soundie-store'
import { DEFAULT_NOTE_ID, getEmotionById, getNoteById } from '@/lib/notes'
import { hexToRgba } from '@/lib/hex-rgba'
import { trpc } from '@/lib/trpc/react'
import { getTeardropVesselBookPrimarySlug } from '@/lib/teardrop-ksiega'
import { LockedNotes } from '@/components/locked-notes'
import {
  MAX_LORE_FRAGMENTS,
  loreUnlockStatusFromTotalListenSeconds,
  minutesRequiredForLoreSlideIndexZeroBased,
} from '@/lib/progress'
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CircleHelp } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface AudioContextType {
  ctx: AudioContext | null
  oscillator: OscillatorNode | null
  gain: GainNode | null
  convolver: ConvolverNode | null
}

type DealerTeardropCard = {
  id: string
  phase: string | null
  phaseOrder: number | null
}

const LORE_STAGES = MAX_LORE_FRAGMENTS
const MIRACLE_SESSION_SECONDS = 180
const SESSION_REPETITIONS = 3
const SESSION_TOTAL_SECONDS = MIRACLE_SESSION_SECONDS * SESSION_REPETITIONS
const DEALER_PACE_MS = 800
const PHASE_PRIORITY = ['roots', 'flow', 'void', 'light', 'archetypes'] as const

function groupCardsByPhase<T extends DealerTeardropCard>(cards: T[]) {
  const groups = new Map<string, T[]>()
  for (const card of cards) {
    const phaseKey = card.phase ?? 'archetypes'
    const bucket = groups.get(phaseKey)
    if (bucket) {
      bucket.push(card)
    } else {
      groups.set(phaseKey, [card])
    }
  }
  const rank = new Map<string, number>(PHASE_PRIORITY.map((p, i) => [p, i]))
  const phaseOrder = Array.from(groups.keys()).sort((a, b) => {
    const ar = rank.get(a) ?? Number.MAX_SAFE_INTEGER
    const br = rank.get(b) ?? Number.MAX_SAFE_INTEGER
    if (ar !== br) return ar - br
    return a.localeCompare(b)
  })
  return phaseOrder.map((phase) => ({
    phase,
    cards: [...(groups.get(phase) ?? [])].sort((a, b) => {
      const ao = a.phaseOrder ?? Number.MAX_SAFE_INTEGER
      const bo = b.phaseOrder ?? Number.MAX_SAFE_INTEGER
      if (ao !== bo) return ao - bo
      return a.id.localeCompare(b.id)
    }),
  }))
}

export function NoteCreature() {
  const locale = useLocale() as 'en' | 'pl'
  const t = useTranslations('noteCreature')

  const activeNoteId = useSoundieStore((s) => s.activeNoteId)
  const progress = useSoundieStore(
    (s) => s.progressByNoteId[s.activeNoteId] ?? EMPTY_NOTE_PROGRESS
  )
  const currentSession = useSoundieStore((s) => s.currentSession)
  const startSession = useSoundieStore((s) => s.startSession)
  const updateSessionElapsed = useSoundieStore((s) => s.updateSessionElapsed)
  const completeSession = useSoundieStore((s) => s.completeSession)
  const dailyGiftGlow = useSoundieStore((s) => s.dailyGiftGlow)
  const dailyGiftForNoteId = useSoundieStore((s) => s.dailyGiftForNoteId)
  const dailyGiftCaption = useSoundieStore((s) => s.dailyGiftCaption)
  const setPendingListenFromDailyGift = useSoundieStore(
    (s) => s.setPendingListenFromDailyGift
  )
  const sessionMoodReaction = useSoundieStore((s) => s.sessionMoodReaction)
  const [growthPulse, setGrowthPulse] = useState(false)
  const [sessionWhisper, setSessionWhisper] = useState<string | null>(null)
  const [ambientShimmer, setAmbientShimmer] = useState(false)
  const [pulseDepth, setPulseDepth] = useState(0)
  const [orbEvolution, setOrbEvolution] = useState(0)
  const [sacredClimax, setSacredClimax] = useState(false)
  const noteQuery = trpc.note.getById.useQuery(
    { id: activeNoteId, locale },
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
    { noteId: activeNoteId, locale, playerId: playerId ?? undefined },
    { enabled: Boolean(playerId), staleTime: 30_000, retry: false },
  )

  const { mutate: trackSessionStart } = trpc.analytics.record.useMutation()
  const { mutate: trackLoreSlideView } = trpc.analytics.record.useMutation()
  const { mutate: recordTeardropFocus } = trpc.teardrop.recordFocus.useMutation()
  const { mutate: completeRemoteSession } = trpc.soundie.completeSession.useMutation({
    onSuccess: (result) => {
      const row = result.soundie
      syncFromRemote(
        {
          totalListenTime: row.totalListenTime,
          level: row.level,
          loreUnlocked: row.loreUnlocked,
        },
        row.noteId
      )
      sessionsQuery.refetch()
    },
  })
  const fallbackDef = getNoteById(activeNoteId) ?? getNoteById(DEFAULT_NOTE_ID)
  const def = noteQuery.data ?? fallbackDef
  const showNoteLoadError =
    noteQuery.isError && !noteQuery.data && !fallbackDef && !noteQuery.isFetching
  if (!def) return null
  const c = def.chromaHex
  const captions = useMemo(() => {
    const fromApi = noteQuery.data?.captions
    if (fromApi && fromApi.length > 0) {
      return fromApi.map((c) => c.body)
    }
    return fallbackDef?.captions ?? []
  }, [noteQuery.data?.captions, fallbackDef?.captions])
  const captionIndex = captions.length > 0
    ? Math.floor(currentSession.elapsed / 20) % captions.length
    : 0
  const activeCaption = captions[captionIndex] ?? null
  const useDailyRareCaption = Boolean(
    dailyGiftForNoteId === activeNoteId && dailyGiftCaption
  )
  const lineCaption = useDailyRareCaption ? dailyGiftCaption : activeCaption
  const minuteMilestoneText = useMemo(
    () => [
      t('minuteEventTone'),
      t('minuteEventEvolution'),
      t('minuteEventShimmer'),
      t('minuteEventPulse'),
      t('minuteEventAwakened'),
    ],
    [t],
  )

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
  const isPlayingRef = useRef(false)
  const lastListenTickAtRef = useRef<number | null>(null)
  const listenSecondsAccRef = useRef(0)
  const effectiveTotalListenTime =
    progress.totalListenTime + (currentSession.active ? currentSession.elapsed : 0)

  const loreFragments = useMemo(() => {
    const key = activeNoteId as
      | 'C'
      | 'C#'
      | 'D'
      | 'D#'
      | 'E'
      | 'F'
      | 'F#'
      | 'G'
      | 'G#'
      | 'A'
      | 'A#'
      | 'B'
    const fromApi = noteQuery.data?.loreFragments
    if (fromApi && fromApi.length > 0) {
      return fromApi
    }
    return t.raw(`lore.${key}`) as string[]
  }, [activeNoteId, t, noteQuery.data?.loreFragments])

  const loreStageTexts = useMemo(() => {
    const out = [...loreFragments]
    while (out.length < LORE_STAGES) out.push('')
    return out.slice(0, LORE_STAGES)
  }, [loreFragments])

  const [loreCarouselApi, setLoreCarouselApi] = useState<CarouselApi | null>(null)
  const [selectedLoreIndex, setSelectedLoreIndex] = useState(0)
  const [justUnlocked, setJustUnlocked] = useState<number | null>(null)
  const [unlockBanner, setUnlockBanner] = useState<{
    primaryOneBased: number
  } | null>(null)
  const [selectedTeardropCardId, setSelectedTeardropCardId] = useState<string | null>(null)
  const [dealerRevealCount, setDealerRevealCount] = useState(0)
  const teardropFocusStartAtRef = useRef<number | null>(null)
  const teardropFocusCardIdRef = useRef<string | null>(null)
  const teardropFocusNoteIdRef = useRef<string | null>(null)
  const loreStatus = useMemo(
    () => loreUnlockStatusFromTotalListenSeconds(effectiveTotalListenTime),
    [effectiveTotalListenTime]
  )
  const hadQualifyingSession = effectiveTotalListenTime >= MIRACLE_SESSION_SECONDS
  const unlockedLoreCount = loreStatus.unlockedFragments
  const prevLoreRef = useRef(loreStatus.unlockedFragments)

  const loreStageUnlocked = (index: number) => index < unlockedLoreCount

  const teardropCards = teardropPlaylistQuery.data?.cards ?? []
  const teardropCardsLoading = teardropPlaylistQuery.isLoading
  const teardropPhasesMeta = teardropPlaylistQuery.data?.phases ?? []
  const phaseTitleBySlug = useMemo(() => {
    const map: Record<string, { pl: string; en: string }> = {}
    for (const p of teardropPhasesMeta) {
      map[p.slug] = { pl: p.titlePl, en: p.titleEn }
    }
    return map
  }, [teardropPhasesMeta])
  const teardropPhaseGroups = useMemo(() => groupCardsByPhase(teardropCards), [teardropCards])
  const teardropCardsInDealerOrder = useMemo(
    () => teardropPhaseGroups.flatMap((g) => g.cards),
    [teardropPhaseGroups],
  )
  const revealedTeardropCards = useMemo(
    () => teardropCardsInDealerOrder.slice(0, dealerRevealCount),
    [teardropCardsInDealerOrder, dealerRevealCount],
  )
  const selectedTeardropCard = useMemo(() => {
    if (revealedTeardropCards.length === 0 || !selectedTeardropCardId) return null
    return revealedTeardropCards.find((card) => card.id === selectedTeardropCardId) ?? null
  }, [revealedTeardropCards, selectedTeardropCardId])
  const lastLoreEventKeyRef = useRef<string | null>(null)
  const minuteMilestoneRef = useRef(0)
  const sacredCycleRef = useRef(0)

  const selectedTeardropTexts = useMemo(() => {
    if (!selectedTeardropCard) {
      return {
        affirmation: '',
        description: '',
        tagline: '',
        meaningUpright: '',
        meaningShadow: '',
      }
    }
    const pick = (field: string) =>
      selectedTeardropCard.texts.find((t) => t.field === field)?.content?.trim() ?? ''
    return {
      affirmation: pick('affirmation'),
      description: pick('description'),
      tagline: pick('tagline'),
      meaningUpright: pick('meaning_upright'),
      meaningShadow: pick('meaning_shadow'),
    }
  }, [selectedTeardropCard])

  const vesselBookSlug = useMemo(
    () => getTeardropVesselBookPrimarySlug(activeNoteId),
    [activeNoteId],
  )

  useEffect(() => {
    setSelectedTeardropCardId(null)
  }, [activeNoteId])

  useEffect(() => {
    const cards = teardropCards
    if (!cards?.length) return
    if (
      teardropShelfOpen &&
      selectedTeardropCardId != null &&
      cards.some((c) => c.id === selectedTeardropCardId)
    ) {
      return
    }
    const unlockedCount = Math.max(1, unlockedLoreCount)
    const cappedLoreIndex = Math.max(
      0,
      Math.min(Math.max(0, unlockedCount - 1), selectedLoreIndex),
    )
    const byLore = cards[cappedLoreIndex % cards.length] ?? null
    const fallback = vesselBookSlug
      ? cards.find((x) => x.slug === vesselBookSlug) ?? null
      : null
    const next = byLore ?? fallback ?? cards[0] ?? null
    if (!next) return
    if (selectedTeardropCardId === next.id) return
    setSelectedTeardropCardId(next.id)
  }, [
    teardropCards,
    teardropShelfOpen,
    unlockedLoreCount,
    selectedLoreIndex,
    vesselBookSlug,
    selectedTeardropCardId,
  ])

  useEffect(() => {
    if (!teardropShelfOpen) {
      setDealerRevealCount(0)
      return
    }
    const total = teardropCardsInDealerOrder.length
    if (total === 0) {
      setDealerRevealCount(0)
      return
    }
    setDealerRevealCount(1)
    if (total === 1) return
    const timer = setInterval(() => {
      setDealerRevealCount((prev) => {
        if (prev >= total) return total
        return prev + 1
      })
    }, DEALER_PACE_MS)
    return () => clearInterval(timer)
  }, [teardropShelfOpen, teardropCardsInDealerOrder])


  useEffect(() => {
    const prevCardId = teardropFocusCardIdRef.current
    const prevStartedAt = teardropFocusStartAtRef.current
    const prevNoteId = teardropFocusNoteIdRef.current
    if (playerId && prevCardId && prevStartedAt && prevNoteId) {
      const durationMs = Date.now() - prevStartedAt
      if (durationMs >= 1500) {
        recordTeardropFocus({
          playerId,
          noteId: prevNoteId,
          cardId: prevCardId,
          durationMs,
          source: 'note_creature',
        })
      }
    }

    if (playerId && teardropShelfOpen && selectedTeardropCardId) {
      teardropFocusCardIdRef.current = selectedTeardropCardId
      teardropFocusStartAtRef.current = Date.now()
      teardropFocusNoteIdRef.current = activeNoteId
    } else {
      teardropFocusCardIdRef.current = null
      teardropFocusStartAtRef.current = null
      teardropFocusNoteIdRef.current = null
    }
  }, [playerId, activeNoteId, teardropShelfOpen, selectedTeardropCardId, recordTeardropFocus])

  useEffect(() => {
    return () => {
      const prevCardId = teardropFocusCardIdRef.current
      const prevStartedAt = teardropFocusStartAtRef.current
      const prevNoteId = teardropFocusNoteIdRef.current
      if (!playerId || !prevCardId || !prevStartedAt || !prevNoteId) return
      const durationMs = Date.now() - prevStartedAt
      if (durationMs < 1500) return
      recordTeardropFocus({
        playerId,
        noteId: prevNoteId,
        cardId: prevCardId,
        durationMs,
        source: 'note_creature',
      })
    }
  }, [playerId, recordTeardropFocus])


  useEffect(() => {
    if (!playerId) return
    const key = [
      playerId,
      activeNoteId,
      selectedLoreIndex,
      selectedTeardropCardId ?? 'none',
      unlockedLoreCount,
    ].join(':')
    if (lastLoreEventKeyRef.current === key) return
    lastLoreEventKeyRef.current = key
    trackLoreSlideView({
      name: 'lore_slide_view',
      playerId,
      meta: {
        noteId: activeNoteId,
        loreIndex: selectedLoreIndex,
        loreUnlocked: unlockedLoreCount,
        teardropCardId: selectedTeardropCardId,
      },
    })
  }, [
    playerId,
    activeNoteId,
    selectedLoreIndex,
    selectedTeardropCardId,
    unlockedLoreCount,
    trackLoreSlideView,
  ])

  const minutesToUnlockFragment = (index: number) => {
    const requiredMin = minutesRequiredForLoreSlideIndexZeroBased(index)
    const totalMin = Math.floor(effectiveTotalListenTime / 60)
    return Math.max(0, requiredMin - totalMin)
  }

  useEffect(() => {
    if (!loreCarouselApi) return
    const idx = Math.max(
      0,
      Math.min(LORE_STAGES - 1, unlockedLoreCount - 1)
    )
    queueMicrotask(() => loreCarouselApi.scrollTo(idx, true))
  }, [loreCarouselApi, activeNoteId, unlockedLoreCount])

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
    if (unlockedLoreCount > prev) {
      const newIdx = unlockedLoreCount - 1
      setJustUnlocked(newIdx)
      setUnlockBanner({ primaryOneBased: unlockedLoreCount })
      if (loreCarouselApi) {
        queueMicrotask(() => loreCarouselApi.scrollTo(newIdx, true))
      }
      const t1 = setTimeout(() => setJustUnlocked(null), 3500)
      const t2 = setTimeout(() => setUnlockBanner(null), 8000)
      prevLoreRef.current = unlockedLoreCount
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
    prevLoreRef.current = unlockedLoreCount
  }, [unlockedLoreCount, loreCarouselApi])

  const ensureAudioGraph = async (): Promise<boolean> => {
    if (!audioRef.current.ctx) {
      const AudioContextClass: typeof AudioContext =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioContext = new AudioContextClass()

      const gainNode = audioContext.createGain()
      gainNode.gain.value = 0.2
      gainNode.connect(audioContext.destination)

      const convolverNode = audioContext.createConvolver()
      convolverNode.connect(gainNode)

      const rate = audioContext.sampleRate
      const length = rate * 2
      const impulseResponse = audioContext.createBuffer(2, length, rate)
      const left = impulseResponse.getChannelData(0)
      const right = impulseResponse.getChannelData(1)
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2)
        left[i] = (Math.random() * 2 - 1) * decay
        right[i] = (Math.random() * 2 - 1) * decay
      }
      convolverNode.buffer = impulseResponse

      audioRef.current = { ctx: audioContext, oscillator: null, gain: gainNode, convolver: convolverNode }
    }

    const ctx = audioRef.current.ctx!
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        return false
      }
    }
    return true
  }

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  const toggleAudio = () => {
    if (isPlaying) {
      pauseAudio()
    } else {
      void playAudio()
    }
  }

  const playAudio = async () => {
    const ready = await ensureAudioGraph()
    if (!ready) return

    const ctx = audioRef.current.ctx!
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = def.frequency

    const gain = audioRef.current.gain!
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.5)

    osc.connect(audioRef.current.convolver!)
    osc.start()

    audioRef.current.oscillator = osc
    setIsPlaying(true)

    if (!currentSession.active) {
      startSession(SESSION_TOTAL_SECONDS)
      const pid = useSoundieStore.getState().playerId
      const nid = useSoundieStore.getState().activeNoteId
      const fromGift = useSoundieStore.getState().pendingListenFromDailyGift
      if (pid) {
        trackSessionStart({
          name: 'session_started',
          playerId: pid,
          meta: fromGift
            ? { noteId: nid, afterDailyGift: true }
            : { noteId: nid },
        })
      }
      if (fromGift) {
        setPendingListenFromDailyGift(false)
      }
    }
  }

  const pauseAudio = useCallback(() => {
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
  }, [])

  useEffect(() => {
    if (!currentSession.active) {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current)
        sessionIntervalRef.current = null
      }
      lastListenTickAtRef.current = null
      listenSecondsAccRef.current = 0
      return
    }

    const startedAt = currentSession.startedAt
    const duration = currentSession.duration
    listenSecondsAccRef.current = useSoundieStore.getState().currentSession.elapsed
    lastListenTickAtRef.current = null

    sessionIntervalRef.current = setInterval(() => {
      const st = useSoundieStore.getState()
      const cs = st.currentSession
      if (!cs.active || cs.startedAt !== startedAt) {
        return
      }

      const now = Date.now()
      if (!isPlayingRef.current) {
        lastListenTickAtRef.current = now
        return
      }

      const last = lastListenTickAtRef.current
      if (last == null) {
        lastListenTickAtRef.current = now
        return
      }
      const delta = Math.min(Math.max((now - last) / 1000, 0), 0.4)
      lastListenTickAtRef.current = now
      listenSecondsAccRef.current = Math.max(0, listenSecondsAccRef.current) + delta
      const acc = listenSecondsAccRef.current
      const d = cs.duration

      if (acc >= d) {
        const credited = d
        updateSessionElapsed(credited)
        completeSession()
        if (credited >= MIRACLE_SESSION_SECONDS) {
          setGrowthPulse(true)
          setTimeout(() => setGrowthPulse(false), 1400)
        }
        setIsPlaying(false)
        pauseAudio()
        const pid = st.playerId
        const nid = st.activeNoteId
        if (pid && credited > 0) {
          completeRemoteSession({
            playerId: pid,
            noteId: nid,
            durationSeconds: credited,
          })
        }
        lastListenTickAtRef.current = null
        listenSecondsAccRef.current = 0
        return
      }
      const floored = Math.min(Math.floor(acc), d)
      updateSessionElapsed(floored)
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
    completeSession,
    completeRemoteSession,
    pauseAudio,
  ])

  useEffect(() => {
    const { ctx, oscillator: osc } = audioRef.current
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

  useEffect(() => {
    if (!currentSession.active) {
      minuteMilestoneRef.current = 0
      sacredCycleRef.current = 0
      setSessionWhisper(null)
      setAmbientShimmer(false)
      setPulseDepth(0)
      setOrbEvolution(0)
      setSacredClimax(false)
      return
    }
    const currentMilestone = Math.floor(currentSession.elapsed / 60)
    if (currentMilestone > minuteMilestoneRef.current) {
      for (let step = minuteMilestoneRef.current + 1; step <= currentMilestone; step += 1) {
        const text = minuteMilestoneText[(step - 1) % minuteMilestoneText.length] ?? minuteMilestoneText[0]
        setSessionWhisper(text)
        setAmbientShimmer(true)
        setTimeout(() => setAmbientShimmer(false), 1800)
        setPulseDepth((p) => Math.min(5, p + 1))
        setOrbEvolution((v) => Math.min(5, v + 1))
      }
      minuteMilestoneRef.current = currentMilestone
    }
    const completedCycles = Math.min(
      SESSION_REPETITIONS,
      Math.floor(currentSession.elapsed / MIRACLE_SESSION_SECONDS),
    )
    if (completedCycles > sacredCycleRef.current) {
      for (let cycle = sacredCycleRef.current + 1; cycle <= completedCycles; cycle += 1) {
        const sacredLine = t('sacredLine')
        setSessionWhisper(sacredLine)
        setSacredClimax(true)
        setTimeout(() => setSacredClimax(false), 2200)
        toast.success(sacredLine, { duration: 3200 })
      }
      sacredCycleRef.current = completedCycles
    }
  }, [currentSession.active, currentSession.elapsed, minuteMilestoneText, t])

  const progressPercent = (currentSession.elapsed / currentSession.duration) * 100
  const currentRepetition = Math.min(
    SESSION_REPETITIONS,
    Math.floor(currentSession.elapsed / MIRACLE_SESSION_SECONDS) + 1,
  )
  const repetitionProgress = Math.min(
    1,
    (currentSession.elapsed % MIRACLE_SESSION_SECONDS) / MIRACLE_SESSION_SECONDS,
  )
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex w-full min-h-0 flex-1 flex-col items-center px-4 pb-8">
      {showNoteLoadError && (
        <p className="mb-4 mt-4 max-w-md text-center font-mono text-xs text-coral-dark">
          {t('loadError')}
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

        {(sessionWhisper ?? lineCaption) && (
          <p
            key={useDailyRareCaption ? 'daily' : captionIndex}
            className="font-mono text-xs italic text-ink-muted mb-3 max-w-xs mx-auto leading-relaxed transition-opacity duration-700"
            style={{ color: hexToRgba(c, 0.7) }}
          >
            {sessionWhisper ?? lineCaption}
          </p>
        )}
        {sessionMoodReaction && (
          <p
            className="text-lora text-sm text-ink/90 mb-3 max-w-sm mx-auto text-center leading-relaxed"
            style={{ color: hexToRgba(c, 0.88) }}
          >
            {sessionMoodReaction}
          </p>
        )}
      </div>

      <div className="w-full max-w-md flex flex-col gap-4">
        <div className="lore-card">
          <div className="mb-5 flex justify-center">
            <div className="relative inline-flex items-center justify-center">
              {ambientShimmer && (
                <span
                  className="pointer-events-none absolute -inset-3 rounded-full animate-pulse"
                  style={{ backgroundColor: hexToRgba(c, 0.12) }}
                />
              )}
              {sacredClimax && (
                <>
                  <span
                    className="pointer-events-none absolute -inset-5 rounded-full"
                    style={{ boxShadow: `0 0 36px ${hexToRgba(c, 0.6)}` }}
                  />
                  <span className="pointer-events-none absolute -inset-8 flex items-center justify-center">
                    {Array.from({ length: 10 }, (_, i) => (
                      <span
                        key={i}
                        className="absolute h-1 w-1 rounded-full"
                        style={{
                          backgroundColor: hexToRgba(c, 0.65),
                          transform: `rotate(${i * 36}deg) translateY(-28px)`,
                        }}
                      />
                    ))}
                  </span>
                </>
              )}
              <span
                className={cn(
                  'inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-pearl bg-pearl font-mono text-[0.62rem] font-bold uppercase tracking-wide text-white shadow-sm transition-all duration-700',
                  hadQualifyingSession && 'scale-110',
                  growthPulse && 'scale-[1.18]',
                  dailyGiftForNoteId === activeNoteId &&
                    dailyGiftGlow &&
                    `daily-glow--${dailyGiftGlow}`,
                )}
                style={
                  dailyGiftForNoteId === activeNoteId && dailyGiftGlow
                    ? {
                        ['--glow' as string]: c,
                        backgroundColor: c,
                        boxShadow: 'none',
                        animationDuration: `${Math.max(1.4, 3 - pulseDepth * 0.25)}s`,
                      }
                    : {
                        backgroundColor: c,
                        boxShadow: `${sacredClimax ? `0 0 0 7px ${hexToRgba(c, 0.28)}` : `0 0 0 4px ${hexToRgba(c, 0.2)}`}`,
                        transform: `scale(${1 + orbEvolution * 0.025})`,
                        animationDuration: `${Math.max(1.4, 3 - pulseDepth * 0.25)}s`,
                      }
                }
                aria-label={def.name}
              >
                {def.short}
              </span>
            </div>
          </div>
          <div className="mb-6 text-center">
            <h2 className="text-lora text-lg font-semibold text-ink">{def.name}</h2>
            <p className="font-mono text-sm" style={{ color: c }}>
              {def.synestheticTitlePl} · {def.element}
            </p>
          </div>

          <div className="mb-6 space-y-4 text-center">
            <div>
              <p className="mb-1 font-mono text-xs text-ink-muted">{t('frequency')}</p>
              <p className="text-lora text-ink">{def.frequency} Hz</p>
            </div>
            {healingChips.length > 0 && (
              <div>
                <p className="mb-2 font-mono text-xs text-ink-muted">{t('supports')}</p>
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
              <p className="mb-3 font-mono text-xs text-ink-muted">{t('loreLabel')}</p>
              {unlockBanner && (
                <div
                  className="mb-4 rounded-xl border px-4 py-3 text-left shadow-sm"
                  style={{
                    borderColor: hexToRgba(c, 0.4),
                    backgroundColor: hexToRgba(c, 0.1),
                    boxShadow: `0 0 0 1px ${hexToRgba(c, 0.12)} inset`,
                  }}
                  role="status"
                >
                  <p className="text-lora text-sm font-medium text-ink">
                    {t('unlockBannerTitle')}
                  </p>
                  <p className="mt-1.5 font-mono text-[0.65rem] leading-relaxed text-ink/90">
                    {t('unlockBannerBody', { n: unlockBanner.primaryOneBased })}
                  </p>
                  <button
                    type="button"
                    className="mt-2 font-mono text-[0.6rem] uppercase tracking-widest text-ink-muted underline-offset-2 hover:underline"
                    onClick={() => setUnlockBanner(null)}
                  >
                    {t('unlockBannerDismiss')}
                  </button>
                </div>
              )}
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
                                    {t('fragmentUnlocked')}
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
                                  {t('minsToUnlock', { mins: minsLeft })}
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
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (teardropCards.length === 0) return
                    setTeardropShelfOpen(!teardropShelfOpen)
                  }}
                  className="font-mono text-[0.65rem] text-ink-muted underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  aria-expanded={teardropShelfOpen}
                  disabled={teardropCards.length === 0}
                >
                  {teardropShelfOpen ? t('shelfClose') : t('shelfOpen')}
                </button>
                {teardropCards.length === 0 && (
                  <p className="mt-1 font-mono text-[0.62rem] text-ink-muted/80">
                    {teardropCardsLoading ? '...' : '—'}
                  </p>
                )}
                {teardropCards.length > 0 && (
                  <div
                    className={cn(
                      'grid transition-all duration-500 ease-out',
                      teardropShelfOpen
                        ? 'mt-3 grid-rows-[1fr] opacity-100'
                        : 'mt-0 grid-rows-[0fr] opacity-0',
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-4">
                        {teardropPhaseGroups.map((group) => {
                          const groupRevealed = group.cards.filter((card) =>
                            revealedTeardropCards.some((r) => r.id === card.id)
                          )
                          if (groupRevealed.length === 0) return null
                          const phaseTitle = phaseTitleBySlug[group.phase]
                          const phaseLabelText = locale === 'pl'
                            ? (phaseTitle?.pl ?? group.phase)
                            : (phaseTitle?.en ?? group.phase)
                          return (
                            <div key={group.phase} className="space-y-1.5">
                              <p
                                className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em]"
                                style={{ color: c }}
                              >
                                {phaseLabelText}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {groupRevealed.map((card, idx) => {
                                  const isVesselBook =
                                    vesselBookSlug !== null && card.slug === vesselBookSlug
                                  return (
                                    <motion.button
                                      key={card.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedTeardropCardId(card.id)
                                        const cardIdx = teardropCardsInDealerOrder.findIndex((x) => x.id === card.id)
                                        if (cardIdx >= 0 && loreCarouselApi) {
                                          const unlockedMax = Math.max(0, unlockedLoreCount - 1)
                                          loreCarouselApi.scrollTo(Math.min(cardIdx, unlockedMax), true)
                                        }
                                      }}
                                      aria-label={
                                        isVesselBook
                                          ? `${card.name} — ${t('shelfVesselBookAria')}`
                                          : card.name
                                      }
                                      initial={{ opacity: 0, y: -8, scale: 0.96, rotateZ: idx % 2 === 0 ? -1 : 1 }}
                                      animate={{ opacity: 1, y: 0, scale: 1, rotateZ: 0 }}
                                      transition={{ duration: 0.24, ease: 'easeOut' }}
                                    >
                                      <div
                                        className="rounded-md border px-2.5 py-1.5 font-mono text-[0.6rem] lowercase tracking-wide transition-all"
                                        style={{
                                          borderColor:
                                            selectedTeardropCard?.id === card.id
                                              ? hexToRgba(c, 0.65)
                                              : isVesselBook
                                                ? hexToRgba(c, 0.5)
                                                : hexToRgba(c, 0.3),
                                          color: c,
                                          backgroundColor:
                                            selectedTeardropCard?.id === card.id
                                              ? hexToRgba(c, 0.1)
                                              : isVesselBook
                                                ? hexToRgba(c, 0.06)
                                                : 'transparent',
                                          boxShadow: isVesselBook
                                            ? `0 0 0 1px ${hexToRgba(c, 0.35)}`
                                            : undefined,
                                        }}
                                      >
                                        {card.name}
                                      </div>
                                    </motion.button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {selectedTeardropCard && (
                        <div
                          className="mt-4 rounded-xl border px-4 py-3 text-left"
                          style={{
                            borderColor: hexToRgba(c, 0.25),
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                          }}
                        >
                          <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-muted">
                            {t('shelfTitle')} · {selectedTeardropCard.name}
                          </p>
                          {selectedTeardropTexts.tagline && (
                            <div className="mt-2">
                              <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-ink-muted">
                                {t('shelfReadingTagline')}
                              </p>
                              <p className="mt-1 text-lora text-sm italic leading-relaxed text-ink/95">
                                {selectedTeardropTexts.tagline}
                              </p>
                            </div>
                          )}
                          {selectedTeardropTexts.description && (
                            <div className="mt-3">
                              <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-ink-muted">
                                {t('shelfReadingDescription')}
                              </p>
                              <p className="mt-1.5 font-mono text-[0.68rem] leading-relaxed text-ink/85">
                                {selectedTeardropTexts.description}
                              </p>
                            </div>
                          )}
                          {selectedTeardropTexts.meaningUpright
                            .split('\n')
                            .map((l) => l.trim())
                            .filter(Boolean).length > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center gap-1.5">
                                <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-ink-muted">
                                  {t('shelfReadingUpright')}
                                </p>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex h-4 w-4 items-center justify-center text-ink-muted/80 transition-colors hover:text-ink"
                                      aria-label={t('shelfMeaningHintTrigger')}
                                    >
                                      <CircleHelp className="h-3.5 w-3.5" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-72 border-pearl-border bg-pearl p-3 text-[0.72rem] leading-relaxed text-ink/90">
                                    {t('shelfReadingUprightHint')}
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[0.75rem] leading-relaxed text-ink/90">
                                {selectedTeardropTexts.meaningUpright
                                  .split('\n')
                                  .map((l) => l.trim())
                                  .filter(Boolean)
                                  .map((line, i) => (
                                    <li key={i}>{line}</li>
                                  ))}
                              </ul>
                            </div>
                          )}
                          {selectedTeardropTexts.meaningShadow
                            .split('\n')
                            .map((l) => l.trim())
                            .filter(Boolean).length > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center gap-1.5">
                                <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-ink-muted">
                                  {t('shelfReadingShadow')}
                                </p>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex h-4 w-4 items-center justify-center text-ink-muted/80 transition-colors hover:text-ink"
                                      aria-label={t('shelfMeaningHintTrigger')}
                                    >
                                      <CircleHelp className="h-3.5 w-3.5" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-72 border-pearl-border bg-pearl p-3 text-[0.72rem] leading-relaxed text-ink/90">
                                    {t('shelfReadingShadowHint')}
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[0.75rem] leading-relaxed text-ink/80">
                                {selectedTeardropTexts.meaningShadow
                                  .split('\n')
                                  .map((l) => l.trim())
                                  .filter(Boolean)
                                  .map((line, i) => (
                                    <li key={i}>{line}</li>
                                  ))}
                              </ul>
                            </div>
                          )}
                          {selectedTeardropTexts.affirmation && (
                            <div className="mt-4 border-t border-pearl-border pt-3">
                              <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-ink-muted">
                                {t('shelfReadingAffirmation')}
                              </p>
                              <p className="mt-1.5 text-lora text-sm italic leading-relaxed text-ink">
                                &ldquo;{selectedTeardropTexts.affirmation}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="border-t border-pearl-border pt-5 text-center">
            <p className="font-mono text-xs text-ink-muted mb-3">{t('listeningSession')}</p>
            {currentSession.active && (
              <div className="mb-3">
                <div className="bg-pearl rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full transition-all duration-100"
                    style={{ width: `${progressPercent}%`, backgroundColor: c }}
                  />
                </div>
                <p className="text-xs text-ink-muted text-center mt-2 font-mono">
                  {formatTime(currentSession.elapsed)} / {formatTime(currentSession.duration)}
                </p>
                <p className="text-[0.65rem] text-ink-muted/80 text-center mt-1 font-mono">
                  {t('sessionRepetition', {
                    current: currentRepetition,
                    total: SESSION_REPETITIONS,
                  })}
                </p>
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  {Array.from({ length: SESSION_REPETITIONS }, (_, i) => {
                    const segment = i + 1
                    const isPast = segment < currentRepetition
                    const isCurrent = segment === currentRepetition
                    const fillPercent = isPast ? 100 : isCurrent ? repetitionProgress * 100 : 0
                    return (
                      <div
                        key={segment}
                        className="h-1.5 w-12 overflow-hidden rounded-full bg-pearl-border/70"
                        aria-hidden
                      >
                        <div
                          className="h-full transition-all duration-300 ease-out"
                          style={{ width: `${fillPercent}%`, backgroundColor: c }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
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
              {isPlaying ? t('stopListening') : t('beginSession')}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-pearl-border bg-pearl-dark px-6 py-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-xs text-ink-muted">{t('journey')}</p>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-pearl px-3 py-2 text-center">
              <p className="font-mono text-lg font-bold text-ink">
                {sessionsQuery.data?.totalCount ?? '—'}
              </p>
              <p className="font-mono text-[0.6rem] text-ink-muted mt-0.5">{t('sessions')}</p>
            </div>
            <div className="rounded-xl bg-pearl px-3 py-2 text-center">
              <p className="font-mono text-lg font-bold text-ink">
                {sessionsQuery.data
                  ? `${Math.floor(sessionsQuery.data.totalSeconds / 60)}m`
                  : '—'}
              </p>
              <p className="font-mono text-[0.6rem] text-ink-muted mt-0.5">{t('totalListened')}</p>
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
