'use client'

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
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
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CircleHelp } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { PostSessionModal } from '@/components/post-session-modal'
import { NoteTimeline } from '@/components/note-timeline'
import { PixiNoteOrb } from '@/components/pixi-note-orb'
import { deriveAffirmation, getTimeOfDay } from '@/lib/affirmation-engine'
import {
  getCosmicAudioFrequencyHz,
  getCosmicInfluenceForNoteShort,
  getPrimaryCosmicInfluenceForNoteShort,
} from '@/lib/cosmic-resonance'
import type { RitualSealPayload } from '@/lib/soundie-rituals'
import {
  buildRitualEchoMeta,
  dualRitualEffectiveListenSeconds,
  dualRitualGain,
  getDualRitualEngine,
  isArrivalTransitionWindow,
  listeningPresenceForDualRitual,
  pickWarmthEchoLine,
  registerDualRitualFromDb,
  resolveListeningQueryNoteId,
  ritualAttributionFor,
  ritualDurationSeconds,
  ritualPhaseAt,
} from '@/lib/soundie-rituals'

interface AudioContextType {
  ctx: AudioContext | null
  oscillator: OscillatorNode | null
  gain: GainNode | null
  convolver: ConvolverNode | null
  ritualOscF: OscillatorNode | null
  ritualOscA: OscillatorNode | null
  ritualPreF: GainNode | null
  ritualPreA: GainNode | null
  cosmicOsc: OscillatorNode | null
  cosmicPre: GainNode | null
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

function teardropMilestoneFromCards(
  cards: Array<{ phase: string | null; arcanaType: string | null }>,
): 0 | 1 | 2 {
  let milestone: 0 | 1 | 2 = 0
  for (const card of cards) {
    if (card.phase === 'archetypes' || card.arcanaType === 'major' || card.arcanaType === 'special') {
      return 2
    }
    if (card.phase === 'void' || card.phase === 'light' || card.phase === 'flow') {
      milestone = 1
    }
  }
  return milestone
}


export function NoteCreature() {
  const locale = useLocale() as 'en' | 'pl'
  const t = useTranslations('noteCreature')
  const tMoods = useTranslations('moodIntelligence.moods')
  const tRitual = useTranslations('soundieRituals')

  const activeRitualId = useSoundieStore((s) => s.activeRitualId)
  const activeNoteId = useSoundieStore((s) => s.activeNoteId)
  const currentSession = useSoundieStore((s) => s.currentSession)
  const progressByNoteIdAll = useSoundieStore((s) => s.progressByNoteId)
  const ritualSeal = useSoundieStore((s) => s.ritualSeal)

  const ritualQuery = trpc.ritual.getById.useQuery(
    { ritualId: activeRitualId ?? '' },
    { enabled: Boolean(activeRitualId), staleTime: 60_000, retry: false },
  )
  const dualEngineActive = useMemo(
    () => getDualRitualEngine(activeRitualId),
    [activeRitualId, ritualQuery.data],
  )

  useEffect(() => {
    if (!ritualQuery.data) return
    registerDualRitualFromDb(ritualQuery.data)
  }, [ritualQuery.data])

  const listeningNoteId = useMemo(() => {
    const dual = dualEngineActive
    if (dual && currentSession.active) {
      const pres = listeningPresenceForDualRitual(dual, currentSession.elapsed)
      return resolveListeningQueryNoteId(pres)
    }
    return activeNoteId
  }, [
    dualEngineActive,
    currentSession.active,
    currentSession.elapsed,
    activeNoteId,
  ])

  const blendPresence = useMemo(() => {
    const dual = dualEngineActive
    if (dual && currentSession.active) {
      return listeningPresenceForDualRitual(dual, currentSession.elapsed)
    }
    return null
  }, [dualEngineActive, currentSession.active, currentSession.elapsed])

  const arrivalTransition = useMemo(() => {
    const dual = dualEngineActive
    if (!dual || !currentSession.active) return false
    return isArrivalTransitionWindow(dual, currentSession.elapsed)
  }, [dualEngineActive, currentSession.active, currentSession.elapsed])

  const orbPartnerHex = useMemo(() => {
    if (!blendPresence || blendPresence.mode !== 'blend') return null
    return getNoteById(blendPresence.partnerNoteId)?.chromaHex ?? null
  }, [blendPresence])

  const ritualDominantHex = useMemo(() => {
    if (!dualEngineActive) return null
    return getNoteById(dualEngineActive.dominantNoteId)?.chromaHex ?? null
  }, [dualEngineActive])

  const progress = useSoundieStore(
    (s) => s.progressByNoteId[s.activeNoteId] ?? EMPTY_NOTE_PROGRESS,
  )
  const progressF = useMemo(
    () =>
      dualEngineActive
        ? (progressByNoteIdAll[dualEngineActive.entryNoteId] ?? EMPTY_NOTE_PROGRESS)
        : EMPTY_NOTE_PROGRESS,
    [dualEngineActive, progressByNoteIdAll],
  )
  const progressA = useMemo(
    () =>
      dualEngineActive
        ? (progressByNoteIdAll[dualEngineActive.dominantNoteId] ?? EMPTY_NOTE_PROGRESS)
        : EMPTY_NOTE_PROGRESS,
    [dualEngineActive, progressByNoteIdAll],
  )
  const startSession = useSoundieStore((s) => s.startSession)
  const updateSessionElapsed = useSoundieStore((s) => s.updateSessionElapsed)
  const completeSession = useSoundieStore((s) => s.completeSession)
  const completeRitualListen = useSoundieStore((s) => s.completeRitualListen)
  const setActiveRitualId = useSoundieStore((s) => s.setActiveRitualId)
  const dailyGiftGlow = useSoundieStore((s) => s.dailyGiftGlow)
  const dailyGiftForNoteId = useSoundieStore((s) => s.dailyGiftForNoteId)
  const dailyGiftCaption = useSoundieStore((s) => s.dailyGiftCaption)
  const setPendingListenFromDailyGift = useSoundieStore(
    (s) => s.setPendingListenFromDailyGift
  )
  const sessionMoodReaction = useSoundieStore((s) => s.sessionMoodReaction)
  const sessionMoodBefore = useSoundieStore((s) => s.sessionMoodBefore)
  const setLastSessionReflection = useSoundieStore((s) => s.setLastSessionReflection)
  const clearLastSessionReflection = useSoundieStore((s) => s.clearLastSessionReflection)
  const lastReflectionId = useSoundieStore((s) => s.lastReflectionId)
  const [growthPulse, setGrowthPulse] = useState(false)
  const [sessionWhisper, setSessionWhisper] = useState<string | null>(null)
  const [ambientShimmer, setAmbientShimmer] = useState(false)
  const [pulseDepth, setPulseDepth] = useState(0)
  const [orbEvolution, setOrbEvolution] = useState(0)
  const [sacredClimax, setSacredClimax] = useState(false)
  const [whisperModalOpen, setWhisperModalOpen] = useState(false)
  const [whisperPhrase, setWhisperPhrase] = useState('')
  const [completedSessionSeconds, setCompletedSessionSeconds] = useState(0)
  const noteQuery = trpc.note.getById.useQuery(
    { id: listeningNoteId, locale },
    { retry: false },
  )
  const syncFromRemote = useSoundieStore((s) => s.syncFromRemote)
  const playerId = useSoundieStore((s) => s.playerId)
  const teardropShelfOpen = useSoundieStore((s) => s.teardropShelfOpen)
  const setTeardropShelfOpen = useSoundieStore((s) => s.setTeardropShelfOpen)
  const pendingLoreFocusIndex = useSoundieStore((s) => s.pendingLoreFocusIndex)
  const setPendingLoreFocusIndex = useSoundieStore((s) => s.setPendingLoreFocusIndex)

  const sessionsQuery = trpc.soundie.getSessions.useQuery(
    { playerId: playerId!, noteId: listeningNoteId },
    { enabled: !!playerId, staleTime: 10_000, retry: false, refetchInterval: 45_000 },
  )
  const streamQuery = trpc.soundie.getRecentAcrossNotes.useQuery(
    { playerId: playerId!, windowHours: 72 },
    { enabled: !!playerId, staleTime: 10_000, retry: false, refetchInterval: 45_000 },
  )
  const teardropPlaylistQuery = trpc.teardrop.getMappedForNote.useQuery(
    { noteId: listeningNoteId, locale, playerId: playerId ?? undefined },
    { enabled: Boolean(playerId), staleTime: 30_000, retry: false },
  )

  const { mutate: trackSessionStart } = trpc.analytics.record.useMutation()
  const { mutate: trackAnalytics } = trpc.analytics.record.useMutation()
  const { mutate: trackLoreSlideView } = trpc.analytics.record.useMutation()
  const { mutate: recordTeardropFocus } = trpc.teardrop.recordFocus.useMutation()
  const { mutate: persistRitualEcho } = trpc.echo.save.useMutation()
  const { mutateAsync: createSessionReflection } = trpc.sessionReflection.createForSession.useMutation()
  const trpcUtils = trpc.useUtils()
  const onRemoteSessionSynced = useCallback(
    (result: {
      soundie: {
        totalListenTime: number
        level: number
        loreUnlocked: number
        noteId: string
      }
    }) => {
      const row = result.soundie
      syncFromRemote(
        {
          totalListenTime: row.totalListenTime,
          level: row.level,
          loreUnlocked: row.loreUnlocked,
        },
        row.noteId,
      )
      void sessionsQuery.refetch()
      void trpcUtils.resonance.getTrace.invalidate()
    },
    [syncFromRemote, sessionsQuery.refetch, trpcUtils.resonance.getTrace],
  )

  const { mutateAsync: pushRemoteListenSession } = trpc.soundie.completeSession.useMutation()

  const completeRemoteSession = useCallback(
    (
      input: { playerId: string; noteId: string; durationSeconds: number },
      moodBefore: import('@/lib/mood-reaction-texts').MoodId | null,
      onReflection: (sessionId: string | null, reflectionId: string | null) => void,
    ) => {
      void pushRemoteListenSession(input)
        .then(async (result) => {
          onRemoteSessionSynced(result)
          if (!moodBefore) {
            onReflection(result.session.id, null)
            return
          }
          try {
            const reflection = await createSessionReflection({
              playerId: input.playerId,
              sessionId: result.session.id,
              noteId: input.noteId,
              moodBefore,
            })
            onReflection(result.session.id, reflection.reflection.id)
          } catch {
            onReflection(result.session.id, null)
          }
        })
        .catch(() => {
          onReflection(null, null)
        })
    },
    [pushRemoteListenSession, onRemoteSessionSynced, createSessionReflection],
  )
  const fallbackDef = getNoteById(listeningNoteId) ?? getNoteById(DEFAULT_NOTE_ID)
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
  const emotionForGraph = sessionMoodBefore
    ? tMoods(sessionMoodBefore)
    : (noteQuery.data?.emotionName ?? emotion?.namePl ?? '')
  const cosmicForNote = useMemo(() => getCosmicInfluenceForNoteShort(def.short), [def.short])
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<AudioContextType>({
    ctx: null,
    oscillator: null,
    gain: null,
    convolver: null,
    ritualOscF: null,
    ritualOscA: null,
    ritualPreF: null,
    ritualPreA: null,
    cosmicOsc: null,
    cosmicPre: null,
  })
  const animationRef = useRef<number | null>(null)
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPlayingRef = useRef(false)
  const lastListenTickAtRef = useRef<number | null>(null)
  const listenSecondsAccRef = useRef(0)
  const effectiveTotalListenTime = useMemo(() => {
    const dual = dualEngineActive
    if (dual && currentSession.active) {
      return dualRitualEffectiveListenSeconds(
        currentSession.elapsed,
        progressF.totalListenTime,
        progressA.totalListenTime,
        dual.meetingEnd,
      )
    }
    return progress.totalListenTime + (currentSession.active ? currentSession.elapsed : 0)
  }, [
    dualEngineActive,
    currentSession.active,
    currentSession.elapsed,
    progress.totalListenTime,
    progressF.totalListenTime,
    progressA.totalListenTime,
  ])

  const loreFragments = useMemo(() => {
    const key = listeningNoteId as
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
  }, [listeningNoteId, t, noteQuery.data?.loreFragments])

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
  const [cardSection, setCardSection] = useState<
    'lore' | 'teardrop' | 'session' | 'journey'
  >('lore')
  const soundiePresenceRef = useRef<HTMLDivElement | null>(null)
  const [teardropSheetOpen, setTeardropSheetOpen] = useState(false)
  const teardropFocusStartAtRef = useRef<number | null>(null)
  const teardropFocusCardIdRef = useRef<string | null>(null)
  const prevCardSectionRef = useRef<'lore' | 'teardrop' | 'session' | 'journey'>('lore')
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
  const teardropMilestone = useMemo(
    () => teardropMilestoneFromCards(teardropCards),
    [teardropCards],
  )
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

  const teardropPreviewLine = useMemo(() => {
    const tag = selectedTeardropTexts.tagline.trim()
    if (tag) return tag
    const desc = selectedTeardropTexts.description.trim()
    const descLine = desc
      .split('\n')
      .map((l) => l.trim())
      .find(Boolean)
    if (descLine) return descLine
    return (
      selectedTeardropTexts.meaningUpright
        .split('\n')
        .map((l) => l.trim())
        .find(Boolean) ?? ''
    )
  }, [selectedTeardropTexts])

  const orbBreathSec = useMemo(
    () => Math.min(8, Math.max(2.4, 440 / Math.max(80, def.frequency))),
    [def.frequency],
  )

  const vesselBookSlug = useMemo(
    () => getTeardropVesselBookPrimarySlug(listeningNoteId),
    [listeningNoteId],
  )

  useEffect(() => {
    setSelectedTeardropCardId(null)
  }, [listeningNoteId])

  useEffect(() => {
    setCardSection('lore')
    setTeardropSheetOpen(false)
    prevCardSectionRef.current = 'lore'
  }, [activeNoteId])

  useEffect(() => {
    const prev = prevCardSectionRef.current
    if (prev !== 'teardrop' && cardSection === 'teardrop' && teardropCards.length > 0) {
      setTeardropShelfOpen(true)
    }
    prevCardSectionRef.current = cardSection
  }, [cardSection, teardropCards.length])

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
      teardropFocusNoteIdRef.current = listeningNoteId
    } else {
      teardropFocusCardIdRef.current = null
      teardropFocusStartAtRef.current = null
      teardropFocusNoteIdRef.current = null
    }
  }, [playerId, listeningNoteId, teardropShelfOpen, selectedTeardropCardId, recordTeardropFocus])

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
      listeningNoteId,
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
        noteId: listeningNoteId,
        loreIndex: selectedLoreIndex,
        loreUnlocked: unlockedLoreCount,
        teardropCardId: selectedTeardropCardId,
      },
    })
  }, [
    playerId,
    listeningNoteId,
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
    if (pendingLoreFocusIndex !== null) {
      const idx = Math.max(0, Math.min(LORE_STAGES - 1, pendingLoreFocusIndex))
      queueMicrotask(() => loreCarouselApi.scrollTo(idx, true))
      setPendingLoreFocusIndex(null)
      return
    }
    const idx = Math.max(
      0,
      Math.min(LORE_STAGES - 1, unlockedLoreCount - 1)
    )
    queueMicrotask(() => loreCarouselApi.scrollTo(idx, true))
  }, [loreCarouselApi, listeningNoteId, unlockedLoreCount, pendingLoreFocusIndex, setPendingLoreFocusIndex])

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

      audioRef.current = {
        ctx: audioContext,
        oscillator: null,
        gain: gainNode,
        convolver: convolverNode,
        ritualOscF: null,
        ritualOscA: null,
        ritualPreF: null,
        ritualPreA: null,
        cosmicOsc: null,
        cosmicPre: null,
      }
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

    const ritualId = useSoundieStore.getState().activeRitualId
    const ctx = audioRef.current.ctx!

    const dualCfg = getDualRitualEngine(ritualId)
    if (dualCfg) {
      const eDef = getNoteById(dualCfg.entryNoteId)
      const dDef = getNoteById(dualCfg.dominantNoteId)
      if (!eDef || !dDef) return

      const preF = ctx.createGain()
      const preA = ctx.createGain()
      preF.gain.value = 0
      preA.gain.value = 0
      preF.connect(audioRef.current.convolver!)
      preA.connect(audioRef.current.convolver!)

      const oscF = ctx.createOscillator()
      const oscA = ctx.createOscillator()
      oscF.type = 'sine'
      oscA.type = 'sine'
      oscF.frequency.value = eDef.frequency
      oscA.frequency.value = dDef.frequency
      oscF.connect(preF)
      oscA.connect(preA)

      const master = 0.2
      const ph0 = ritualPhaseAt(dualCfg, 0)
      const m0 = dualRitualGain(ph0)
      const ct = ctx.currentTime
      oscF.start()
      oscA.start()
      preF.gain.setValueAtTime(0, ct)
      preA.gain.setValueAtTime(0, ct)
      preF.gain.linearRampToValueAtTime(master * m0.entry, ct + 0.5)
      preA.gain.linearRampToValueAtTime(master * m0.dominant, ct + 0.5)

      audioRef.current.ritualOscF = oscF
      audioRef.current.ritualOscA = oscA
      audioRef.current.ritualPreF = preF
      audioRef.current.ritualPreA = preA

      const gainMain = audioRef.current.gain!
      gainMain.gain.setValueAtTime(0, ct)
      gainMain.gain.linearRampToValueAtTime(0.2, ct + 0.5)

      setIsPlaying(true)

      if (!currentSession.active) {
        startSession(ritualDurationSeconds(dualCfg.id))
        const pid = useSoundieStore.getState().playerId
        if (pid) {
          trackSessionStart({
            name: 'session_started',
            playerId: pid,
            meta: {
              ritualId: dualCfg.id,
              ritualKey: dualCfg.ritualKey,
              notes: [dualCfg.entryNoteId, dualCfg.dominantNoteId],
            },
          })
        }
      }
      return
    }

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = def.frequency

    const gain = audioRef.current.gain!
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.5)

    osc.connect(audioRef.current.convolver!)
    osc.start()

    if (cosmicForNote.length > 0) {
      const primary = getPrimaryCosmicInfluenceForNoteShort(def.short)
      const cosmicHz = primary ? getCosmicAudioFrequencyHz(primary.orbitalDays) : def.frequency
      const cosmicPre = ctx.createGain()
      cosmicPre.gain.value = 0
      cosmicPre.connect(audioRef.current.convolver!)
      const cosmicOsc = ctx.createOscillator()
      cosmicOsc.type = 'sine'
      cosmicOsc.frequency.value = cosmicHz
      cosmicOsc.connect(cosmicPre)
      const now = ctx.currentTime
      // Planet layer is subtle and supportive, never overpowering the core note.
      cosmicPre.gain.setValueAtTime(0, now)
      cosmicPre.gain.linearRampToValueAtTime(0.032, now + 0.65)
      cosmicOsc.start()
      audioRef.current.cosmicOsc = cosmicOsc
      audioRef.current.cosmicPre = cosmicPre
    }

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
    const rF = audioRef.current.ritualOscF
    const rA = audioRef.current.ritualOscA
    const cOsc = audioRef.current.cosmicOsc
    const cPre = audioRef.current.cosmicPre

    if (rF && rA && ctx) {
      const gain = audioRef.current.gain!
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)
      setTimeout(() => {
        try {
          rF.stop()
          rA.stop()
        } catch {
        }
        audioRef.current.ritualOscF = null
        audioRef.current.ritualOscA = null
        audioRef.current.ritualPreF = null
        audioRef.current.ritualPreA = null
      }, 320)
      setIsPlaying(false)
      return
    }

    if (osc && ctx) {
      const gain = audioRef.current.gain!
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)

      setTimeout(() => {
        osc.stop()
        audioRef.current.oscillator = null
      }, 300)
    }
    if (cOsc && ctx) {
      if (cPre) cPre.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25)
      setTimeout(() => {
        try {
          cOsc.stop()
        } catch {
        }
        audioRef.current.cosmicOsc = null
        audioRef.current.cosmicPre = null
      }, 260)
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

      const ctxBr = audioRef.current.ctx
      const preFG = audioRef.current.ritualPreF
      const preAG = audioRef.current.ritualPreA
      const ridLoop = st.activeRitualId
      const rcfg = getDualRitualEngine(ridLoop)
      if (rcfg && ctxBr && preFG && preAG && isPlayingRef.current) {
        const phGain = ritualPhaseAt(rcfg, Math.min(acc, d))
        const mu = dualRitualGain(phGain)
        const tg = ctxBr.currentTime
        const masterG = 0.2
        const rg = 0.08
        preFG.gain.linearRampToValueAtTime(masterG * mu.entry, tg + rg)
        preAG.gain.linearRampToValueAtTime(masterG * mu.dominant, tg + rg)
      }

      if (acc >= d) {
        const credited = d
        const ritualIdComplete = st.activeRitualId
        const moodBeforeForSession = st.sessionMoodBefore
        updateSessionElapsed(credited)
        clearLastSessionReflection()

        setIsPlaying(false)
        pauseAudio()

        const ritualCfg = getDualRitualEngine(ritualIdComplete)
        if (ritualCfg) {
          const phrase =
            ritualCfg.ritualKey === 'warmth'
              ? pickWarmthEchoLine([
                  tRitual('warmth.echoLineA'),
                  tRitual('warmth.echoLineB'),
                ])
              : tRitual('sealedEchoLine', {
                  dominant:
                    getNoteById(ritualCfg.dominantNoteId)?.short ??
                    ritualCfg.dominantNoteId,
                })
          const seal: RitualSealPayload = {
            ritualKey: ritualCfg.ritualKey,
            ritualId: ritualCfg.id,
            dominantNoteId: ritualCfg.dominantNoteId,
            entryNoteId: ritualCfg.entryNoteId,
            notesInvolved: [ritualCfg.entryNoteId, ritualCfg.dominantNoteId],
            phrase,
            elapsedSeconds: credited,
          }
          completeRitualListen(ritualAttributionFor(ritualCfg.id), seal)
          const pidR = st.playerId
          if (pidR) {
            void (async () => {
              trackAnalytics({
                name: 'ritual_completed',
                playerId: pidR,
                meta: {
                  ritual_id: ritualCfg.ritualKey,
                  dominant_note: ritualCfg.dominantNoteId,
                  entry_note: ritualCfg.entryNoteId,
                },
              })
              const segs = ritualAttributionFor(ritualCfg.id)
              let modalSessionId: string | null = null
              let modalReflectionId: string | null = null
              for (const seg of segs) {
                try {
                  const result = await pushRemoteListenSession({
                    playerId: pidR,
                    noteId: seg.noteId,
                    durationSeconds: seg.seconds,
                  })
                  onRemoteSessionSynced(result)
                  if (moodBeforeForSession) {
                    try {
                      const reflection = await createSessionReflection({
                        playerId: pidR,
                        sessionId: result.session.id,
                        noteId: seg.noteId,
                        moodBefore: moodBeforeForSession,
                      })
                      if (seg.noteId === ritualCfg.dominantNoteId) {
                        modalSessionId = result.session.id
                        modalReflectionId = reflection.reflection.id
                      }
                    } catch {
                      if (seg.noteId === ritualCfg.dominantNoteId) {
                        modalSessionId = result.session.id
                      }
                    }
                  } else if (seg.noteId === ritualCfg.dominantNoteId) {
                    modalSessionId = result.session.id
                  }
                } catch {
                }
              }
              setLastSessionReflection(modalSessionId, modalReflectionId)
              const gs = useSoundieStore.getState()
              const domProg = gs.progressByNoteId[ritualCfg.dominantNoteId]
              const eco = buildRitualEchoMeta(ritualCfg, credited)
              persistRitualEcho({
                playerId: pidR,
                noteId: ritualCfg.dominantNoteId,
                phrase,
                mood: null,
                timeOfDay: getTimeOfDay(),
                streak: Math.floor((domProg?.totalListenTime ?? 0) / SESSION_TOTAL_SECONDS),
                ritualMeta: {
                  ritualKey: eco.ritualKey,
                  ritualId: eco.ritualId,
                  entryNote: eco.entryNote,
                  dominantNote: eco.dominantNote,
                  notes: [...eco.notes],
                  elapsedSeconds: eco.elapsedSeconds,
                  phraseSource: 'ritual_seal',
                },
              })
            })()
          }
          setWhisperPhrase(phrase)
          setCompletedSessionSeconds(credited)
          if (credited >= MIRACLE_SESSION_SECONDS) {
            setGrowthPulse(true)
            setTimeout(() => setGrowthPulse(false), 1400)
          }
          setTimeout(() => setWhisperModalOpen(true), 900)
          lastListenTickAtRef.current = null
          listenSecondsAccRef.current = 0
          return
        }

        completeSession()
        if (credited >= MIRACLE_SESSION_SECONDS) {
          setGrowthPulse(true)
          setTimeout(() => setGrowthPulse(false), 1400)
        }
        const pid = st.playerId
        const nid = st.activeNoteId
        if (pid && credited > 0) {
          completeRemoteSession({
            playerId: pid,
            noteId: nid,
            durationSeconds: credited,
          }, moodBeforeForSession, (sessionId, reflectionId) => {
            setLastSessionReflection(sessionId, reflectionId)
          })
        }
        const storeSnap = useSoundieStore.getState()
        const streakCount = storeSnap.progressByNoteId[nid]
          ? Math.floor((storeSnap.progressByNoteId[nid]!.totalListenTime + credited) / SESSION_TOTAL_SECONDS)
          : 0
        const phrase = deriveAffirmation({
          noteId: nid,
          mood: (storeSnap.sessionMoodReaction ? 'anxious' : null) as import('@/lib/affirmation-engine').Mood,
          timeOfDay: getTimeOfDay(),
          streak: streakCount,
          sessionLengthSeconds: credited,
          teardropMilestone,
          locale,
        })
        setWhisperPhrase(phrase)
        setCompletedSessionSeconds(credited)
        setTimeout(() => setWhisperModalOpen(true), 900)
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
    completeRitualListen,
    pauseAudio,
    locale,
    teardropMilestone,
    onRemoteSessionSynced,
    pushRemoteListenSession,
    tRitual,
    trackAnalytics,
    persistRitualEcho,
    createSessionReflection,
    clearLastSessionReflection,
    setLastSessionReflection,
  ])

  useEffect(() => {
    if (audioRef.current.ritualOscF || audioRef.current.ritualOscA) return
    const { ctx, oscillator: osc, cosmicOsc: cOsc } = audioRef.current
    if (osc && ctx) {
      osc.frequency.setValueAtTime(def.frequency, ctx.currentTime)
    }
    if (cOsc && ctx) {
      const primary = getPrimaryCosmicInfluenceForNoteShort(def.short)
      const cosmicHz = primary ? getCosmicAudioFrequencyHz(primary.orbitalDays) : def.frequency
      cOsc.frequency.setValueAtTime(cosmicHz, ctx.currentTime)
    }
  }, [def.frequency, def.short])

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
    if (activeRitualId) return
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
  }, [currentSession.active, currentSession.elapsed, minuteMilestoneText, t, activeRitualId])

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

  const handleWhisperClose = () => {
    setWhisperModalOpen(false)
  }
  const handleWhisperListenAgain = () => {
    setWhisperModalOpen(false)
    void playAudio()
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
            className="font-body-serif text-sm text-ink/90 mb-3 max-w-sm mx-auto text-center leading-relaxed"
            style={{ color: hexToRgba(c, 0.88) }}
          >
            {sessionMoodReaction}
          </p>
        )}
        {arrivalTransition && (
          <p className="font-mono mx-auto mb-3 max-w-sm text-[0.65rem] uppercase tracking-[0.22em] text-coral/90">
            {tRitual('arrivalMoment')}
          </p>
        )}
      </div>

      <div ref={soundiePresenceRef} className="w-full max-w-md flex flex-col gap-4">
        <div className="soundie-presence-shell lore-card relative overflow-hidden rounded-2xl border border-pearl-border/55 shadow-[0_12px_48px_-16px_rgba(15,23,42,0.1)]">
          <div
            className="pointer-events-none absolute inset-0 soundie-card-ambient"
            style={{ background: `linear-gradient(125deg, transparent 0%, ${hexToRgba(c, 0.07)} 42%, transparent 78%)` }}
          />
          <div className="relative z-[1] px-5 pb-5 pt-6">
            <div className="mb-6 flex flex-col items-center text-center">
              <button
                type="button"
                onClick={() => toggleAudio()}
                className={cn(
                  'soundie-hero-orb group relative mb-5 flex h-[6.75rem] w-[6.75rem] shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-pearl',
                  isPlaying && 'soundie-hero-orb--playing',
                )}
                style={{ ['--orb-breath' as string]: `${orbBreathSec}s` } as CSSProperties}
                aria-label={isPlaying ? t('stopListening') : t('beginSession')}
              >
                <PixiNoteOrb
                  noteHex={c}
                  partnerHex={orbPartnerHex}
                  noteShort={def.short}
                  frequencyHz={def.frequency}
                  isPlaying={isPlaying}
                  pulseDepth={pulseDepth}
                  orbEvolution={orbEvolution}
                  ambientShimmer={ambientShimmer}
                  sacredClimax={sacredClimax}
                  arrivalTransition={arrivalTransition}
                />
                {cosmicForNote.length > 0 && (
                  <span
                    className="pointer-events-none absolute inset-[-6px] rounded-full border animate-pulse"
                    style={{
                      borderColor: hexToRgba(c, 0.2),
                      boxShadow: `0 0 0 1px ${hexToRgba(c, 0.18)}, 0 0 24px ${hexToRgba(c, 0.18)}`,
                    }}
                    aria-hidden
                  />
                )}
                {dailyGiftForNoteId === activeNoteId && dailyGiftGlow && (
                  <span
                    className={cn('pointer-events-none absolute inset-0 rounded-full', `daily-glow--${dailyGiftGlow}`)}
                    style={{ ['--glow' as string]: c } as CSSProperties}
                  />
                )}
              </button>

              <h2 className="font-body-serif text-2xl font-semibold tracking-tight text-ink md:text-[1.65rem]">
                {def.name}
              </h2>
              <p className="font-body-serif mt-2 max-w-[18rem] text-sm italic leading-snug text-ink/70">
                {t(`archetypeWhisper.${listeningNoteId.replace(/^the-/, '')}`)}
              </p>
              <p className="font-mono mt-2 text-[0.62rem] uppercase tracking-[0.22em] text-ink-muted/85">
                {def.frequency} Hz
              </p>
              <p className="font-mono mt-1 text-[0.58rem] tracking-[0.14em] text-ink-muted/70">
                {def.synestheticTitlePl} · {def.element}
              </p>
              {healingChips.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {healingChips.map((chip) => (
                    <span
                      key={chip.key}
                      className="inline-flex items-center rounded-full border border-pearl-border/60 bg-pearl/40 px-2.5 py-0.5 font-mono text-[0.58rem] font-normal tracking-wide text-ink/55 lowercase"
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-5 flex rounded-full bg-pearl-dark/35 p-1 shadow-inner">
              {(
                [
                  ['lore', t('tabLore')],
                  ['teardrop', t('tabTeardrop')],
                  ['session', t('tabSession')],
                  ['journey', t('tabJourney')],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCardSection(id)}
                  className={cn(
                    'min-w-0 flex-1 rounded-full px-2 py-2 font-mono text-[0.58rem] uppercase tracking-[0.12em] transition-all duration-300',
                    cardSection === id
                      ? 'bg-pearl text-ink shadow-sm'
                      : 'text-ink-muted/80 hover:text-ink/90',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {cardSection === 'lore' && (
            <div>
              <p className="mb-2 font-mono text-[0.55rem] uppercase tracking-[0.24em] text-ink-muted/80">
                {t('loreLabel')} · {t('loreAwakened')}
              </p>
              <div className="mb-4 flex justify-center gap-1.5">
                {Array.from({ length: LORE_STAGES }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-2 w-2 rounded-full transition-all duration-500',
                      i < unlockedLoreCount ? 'scale-110' : 'scale-90 opacity-35',
                    )}
                    style={{
                      backgroundColor: i < unlockedLoreCount ? c : hexToRgba(c, 0.2),
                      boxShadow:
                        i < unlockedLoreCount ? `0 0 10px ${hexToRgba(c, 0.35)}` : undefined,
                    }}
                  />
                ))}
              </div>
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
                  <p className="font-body-serif text-sm font-medium text-ink">
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
                                <p className="font-body-serif mx-auto max-w-prose text-sm italic text-ink leading-relaxed">
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
            </div>
            )}

            {cardSection === 'teardrop' && (
            <div className="space-y-4 text-center">
              <div>
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
                          if (group.phase.trim().toLowerCase() !== 'archetypes') return null
                          const groupRevealed = group.cards.filter((card) =>
                            revealedTeardropCards.some((r) => r.id === card.id)
                          )
                          if (groupRevealed.length === 0) return null
                          return (
                            <div key={group.phase}>
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
                    </div>
                  </div>
                )}
                {selectedTeardropCard && (
                  <div
                    className="mx-auto mt-5 max-w-sm rounded-xl border border-pearl-border/65 bg-white px-4 py-3 text-left shadow-[0_6px_24px_-12px_rgba(0,0,0,0.08)]"
                    style={{ borderColor: hexToRgba(c, 0.28) }}
                  >
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink">
                      {selectedTeardropCard.name}
                    </p>
                    {teardropPreviewLine ? (
                      <p className="font-body-serif mt-2 line-clamp-3 text-sm leading-relaxed text-ink/78">
                        {teardropPreviewLine}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setTeardropSheetOpen(true)}
                      className="mt-3 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ink-muted underline decoration-ink/25 underline-offset-4 transition-colors hover:text-ink"
                    >
                      {t('openMeaning')}
                    </button>
                  </div>
                )}
              </div>
            </div>
            )}

          {cardSection === 'session' && (
          <div className="border-t border-pearl-border/50 pt-5 text-center">
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-ink-muted mb-4">{t('listeningSession')}</p>
            {currentSession.active && (
              <div className="mb-5">
                <div className="relative mx-auto h-3 w-full max-w-[14rem] overflow-hidden rounded-full bg-pearl-dark/50 shadow-inner">
                  <div
                    className="pointer-events-none absolute inset-0 soundie-session-breath opacity-40"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${hexToRgba(c, 0.35)}, transparent)`,
                    }}
                  />
                  <div
                    className="relative z-[1] h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${progressPercent}%`,
                      background: `linear-gradient(90deg, ${hexToRgba(c, 0.45)}, ${hexToRgba(c, 0.85)})`,
                      boxShadow: `0 0 20px ${hexToRgba(c, 0.25)}`,
                    }}
                  />
                </div>
                <p className="mt-5 font-mono text-3xl font-light tabular-nums tracking-tight text-ink">
                  {formatTime(currentSession.elapsed)}
                  <span className="text-lg font-normal text-ink-muted/60"> / </span>
                  <span className="text-xl text-ink-muted">{formatTime(currentSession.duration)}</span>
                </p>
                <p className="text-[0.65rem] text-ink-muted/80 text-center mt-2 font-mono">
                  {t('sessionRepetition', {
                    current: currentRepetition,
                    total: SESSION_REPETITIONS,
                  })}
                </p>
                <div className="mt-3 flex items-center justify-center gap-1.5">
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
            <p className="font-body-serif mb-3 text-sm italic text-ink/65">{t('remainWithNote', { note: def.short })}</p>
            {streamQuery.data && streamQuery.data.sessions.length > 0 && (
              <NoteTimeline
                sessions={streamQuery.data.sessions}
                totalSeconds={streamQuery.data.totalSeconds}
                windowHours={streamQuery.data.windowHours}
                sessionElapsedSeconds={currentSession.elapsed}
                sessionActive={currentSession.active}
                isPlaying={isPlaying}
                frequencyHz={def.frequency}
                pulseDepth={pulseDepth}
                sacredClimax={sacredClimax}
                activeNoteHex={c}
                activeNoteShort={def.short}
                emotionLabel={emotionForGraph}
                inTheLightLine={def.synestheticLinePl}
                moodFromCheckIn={sessionMoodBefore != null}
                locale={locale as 'en' | 'pl'}
                className="mb-4"
              />
            )}
            <button
              type="button"
              onClick={toggleAudio}
              className={cn(
                'w-full rounded-full px-8 py-3.5 font-mono text-sm font-semibold transition-all duration-300',
                isPlaying
                  ? 'bg-coral-dark text-pearl shadow-[0_0_28px_-4px_rgba(255,107,74,0.45)] hover:bg-coral'
                  : 'bg-coral text-pearl shadow-[0_0_32px_-6px_rgba(255,107,74,0.55)] hover:bg-coral-light hover:shadow-[0_0_36px_-4px_rgba(255,107,74,0.5)]',
              )}
            >
              {isPlaying ? t('stopListening') : t('beginSession')}
            </button>
          </div>
          )}

          {cardSection === 'journey' && (
            <div className="rounded-xl border border-pearl-border/55 bg-pearl-dark/25 px-4 py-4 text-left">
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-ink-muted">{t('journeyTitle')}</p>
              <p className="font-body-serif mt-3 text-sm text-ink/88">
                {sessionsQuery.data
                  ? t('journeyReturns', { count: sessionsQuery.data.totalCount })
                  : '—'}
              </p>
              <p className="font-body-serif mt-1.5 text-sm text-ink/88">
                {sessionsQuery.data
                  ? t('journeyResonance', {
                      minutes: Math.floor(sessionsQuery.data.totalSeconds / 60),
                    })
                  : '—'}
              </p>
              <p className="font-body-serif mt-1.5 text-sm text-ink/75">
                {sessionsQuery.data?.sessions[0]?.completedAt
                  ? t('journeyLastVisit', {
                      when: new Date(sessionsQuery.data.sessions[0].completedAt).toLocaleString(
                        locale === 'pl' ? 'pl-PL' : 'en-US',
                        {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      ),
                    })
                  : '—'}
              </p>
              {sessionsQuery.data && sessionsQuery.data.sessions.length > 0 && (
                <div className="mt-4 space-y-1 border-t border-pearl-border/40 pt-3">
                  {sessionsQuery.data.sessions.slice(0, 3).map((s) => (
                    <div key={s.id} className="flex items-center justify-between">
                      <p className="font-mono text-[0.62rem] text-ink-muted">
                        {new Date(s.completedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="font-mono text-[0.62rem] text-ink-muted">
                        +{Math.floor(s.duration / 60)}m {s.duration % 60}s
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Sheet open={teardropSheetOpen} onOpenChange={setTeardropSheetOpen}>
            <SheetContent
              side="bottom"
              className="flex max-h-[88vh] flex-col gap-0 overflow-hidden rounded-t-2xl border-pearl-border bg-white p-0 sm:mx-auto sm:max-w-lg"
            >
              <SheetHeader className="sticky top-0 z-10 shrink-0 border-b border-pearl-border/50 bg-white px-4 pb-3 pt-3 pr-14 text-left">
                <SheetTitle className="font-body-serif text-lg font-normal text-ink">
                  {selectedTeardropCard?.name ?? t('tabTeardrop')}
                </SheetTitle>
              </SheetHeader>
              {selectedTeardropCard && (
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-2">
                  <Card className="gap-0 border-pearl-border bg-white py-0 shadow-[0_4px_24px_-12px_rgba(15,23,42,0.08)]">
                    <CardContent className="px-4 py-5 text-left">
                      <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-muted">
                        {t('shelfTitle')} · {selectedTeardropCard.name}
                      </p>
                      {selectedTeardropTexts.tagline && (
                        <div className="mt-2">
                          <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-ink-muted">
                            {t('shelfReadingTagline')}
                          </p>
                          <p className="mt-1 font-body-serif text-sm italic leading-relaxed text-ink/95">
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
                          <p className="mt-1.5 font-body-serif text-sm italic leading-relaxed text-ink">
                            &ldquo;{selectedTeardropTexts.affirmation}&rdquo;
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </SheetContent>
          </Sheet>

          </div>
        </div>
      </div>

      <PostSessionModal
        open={whisperModalOpen}
        phrase={whisperPhrase}
        noteId={ritualSeal?.dominantNoteId ?? activeNoteId}
        noteShort={
          ritualSeal
            ? getNoteById(ritualSeal.dominantNoteId)?.short ?? def.short
            : def.short
        }
        noteHex={
          ritualSeal ? (getNoteById(ritualSeal.dominantNoteId)?.chromaHex ?? c) : c
        }
        playerId={playerId}
        mood={null}
        reflectionId={lastReflectionId}
        timeOfDay={getTimeOfDay()}
        streak={
          ritualSeal
            ? Math.floor(
                (progressByNoteIdAll[ritualSeal.dominantNoteId]?.totalListenTime ?? 0) /
                  SESSION_TOTAL_SECONDS,
              )
            : progress.totalListenTime > 0
              ? Math.floor(progress.totalListenTime / SESSION_TOTAL_SECONDS)
              : 0
        }
        sessionLengthSeconds={completedSessionSeconds}
        onClose={handleWhisperClose}
        onListenAgain={handleWhisperListenAgain}
      />
    </div>
  )
}

if (typeof window !== 'undefined' && !document.getElementById('soundie-note-creature-animations')) {
  const style = document.createElement('style')
  style.id = 'soundie-note-creature-animations'
  style.textContent = `
    @keyframes breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    @keyframes soundieOrbBreathe {
      0%, 100% { transform: scale(1); filter: brightness(1); }
      50% { transform: scale(1.06); filter: brightness(1.08); }
    }
    @keyframes soundieOrbBreathePlaying {
      0%, 100% { transform: scale(1.02); }
      50% { transform: scale(1.12); }
    }
    @keyframes soundieOrbGlow {
      0%, 100% { opacity: 0.45; }
      50% { opacity: 0.92; }
    }
    @keyframes soundieAmbientDrift {
      0%, 100% { transform: translateX(-3%) translateY(2%) rotate(0deg); }
      33% { transform: translateX(2%) translateY(-1%) rotate(0.4deg); }
      66% { transform: translateX(1%) translateY(1.5%) rotate(-0.3deg); }
    }
    @keyframes soundieSessionBreath {
      0%, 100% { transform: translateX(-28%); opacity: 0.18; }
      50% { transform: translateX(28%); opacity: 0.48; }
    }
    @keyframes soundieOrbDust {
      0%, 100% { opacity: 0.25; transform: translateY(0); }
      50% { opacity: 0.75; transform: translateY(-3px); }
    }
    @keyframes soundieOrbResonance {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 0.9; transform: scale(1.04); }
    }
    .soundie-card-ambient {
      animation: soundieAmbientDrift 18s ease-in-out infinite;
    }
    .soundie-hero-orb {
      animation: soundieOrbBreathe var(--orb-breath, 4s) ease-in-out infinite;
    }
    .soundie-hero-orb--playing {
      animation: soundieOrbBreathePlaying var(--orb-breath, 3s) ease-in-out infinite;
    }
    .soundie-orb-glow-ring {
      animation: soundieOrbGlow calc(var(--orb-breath, 4s) * 1.15) ease-in-out infinite;
    }
    .soundie-orb-glow-ring-inner {
      animation: soundieOrbGlow calc(var(--orb-breath, 4s) * 0.88) ease-in-out infinite reverse;
    }
    .soundie-orb-dust {
      animation: soundieOrbDust 4s ease-in-out infinite;
    }
    .soundie-orb-particle {
      animation: soundieOrbDust 3.2s ease-in-out infinite;
    }
    .soundie-orb-resonance--play {
      animation: soundieOrbResonance calc(var(--orb-breath, 4s) * 0.85) ease-in-out infinite;
    }
    .soundie-session-breath {
      animation: soundieSessionBreath 5.2s ease-in-out infinite;
    }
  `
  document.head.appendChild(style)
}
