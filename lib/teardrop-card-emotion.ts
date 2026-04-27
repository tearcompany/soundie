import { EMOTIONS } from './notes'

export type TeardropEmotionId = (typeof EMOTIONS)[number]['id']

const VALID_EMOTION_IDS = new Set<string>(EMOTIONS.map((e) => e.id))

export const TEARDROP_EMOTION_ID_BY_SLUG = {
  'the-seed': 'anxiety',
  'the-soil': 'attachment',
  'the-anchor': 'anxiety',
  'the-shell': 'attachment',
  'the-core': 'shame',
  'the-stone': 'frustration',
  'the-branch': 'frustration',
  'the-tree': 'attachment',
  'the-stream': 'frustration',
  'the-tide': 'grief',
  'the-ebb': 'grief',
  'the-drift': 'anxiety',
  'the-surge': 'anger',
  'the-whisper': 'anxiety',
  'the-breaker': 'anger',
  'the-shadow': 'shame',
  'the-pause': 'guilt',
  'the-abyss': 'grief',
  'the-fog': 'anxiety',
  'the-silence': 'sadness',
  'the-stillness': 'guilt',
  'the-veil': 'anxiety',
  'the-glow': 'dissatisfaction',
  'the-halo': 'shame',
  'the-lantern': 'anxiety',
  'the-sun': 'dissatisfaction',
  'the-star': 'grief',
  'the-prism': 'envy',
  'the-beam': 'frustration',
  'the-initiate': 'anxiety',
  'the-path': 'frustration',
  'the-crossing': 'anxiety',
  'the-sanctuary': 'attachment',
  'the-echo': 'grief',
  'the-pulse': 'anxiety',
  'the-flame': 'anger',
  'the-watcher': 'attachment',
  'the-wave': 'anger',
  'the-weaver': 'frustration',
  'the-witness': 'sadness',
  'the-mirror': 'shame',
  'the-return': 'grief',
  'the-bridge': 'attachment',
  'the-messenger': 'anxiety',
  'the-guardian': 'attachment',
  'the-lightkeeper': 'dissatisfaction',
  'the-spiral': 'shame',
  'the-teardrop': 'grief',
  'the-teardrop-bearer': 'grief',
  'the-vessel': 'guilt',
} as const satisfies Record<string, TeardropEmotionId>

export function getTeardropEmotionIdForSlug(
  slug: string,
): TeardropEmotionId | null {
  return (
    (TEARDROP_EMOTION_ID_BY_SLUG as Record<string, TeardropEmotionId>)[slug] ??
    null
  )
}

export function assertTeardropEmotionMapMatchesDeck(
  deckSlugs: readonly string[],
) {
  const deck = new Set(deckSlugs)
  for (const k of Object.keys(TEARDROP_EMOTION_ID_BY_SLUG)) {
    if (!deck.has(k)) {
      throw new Error(`teardrop emotion: orphan key ${k}`)
    }
  }
  for (const slug of deckSlugs) {
    const eid = (TEARDROP_EMOTION_ID_BY_SLUG as Record<string, string>)[
      slug
    ] as string | undefined
    if (eid == null) {
      throw new Error(`teardrop emotion: missing for ${slug}`)
    }
    if (!VALID_EMOTION_IDS.has(eid)) {
      throw new Error(
        `teardrop emotion: invalid id "${eid}" for ${slug}`,
      )
    }
  }
  if (
    Object.keys(TEARDROP_EMOTION_ID_BY_SLUG).length !== deckSlugs.length
  ) {
    throw new Error('teardrop emotion: key count does not match deck size')
  }
}
