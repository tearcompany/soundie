export const TEARDROP_SLUG_TO_FOLDER_PHASE = {
  'the-seed': 'roots',
  'the-soil': 'roots',
  'the-anchor': 'roots',
  'the-shell': 'roots',
  'the-core': 'roots',
  'the-stone': 'roots',
  'the-branch': 'roots',
  'the-tree': 'roots',
  'the-stream': 'flow',
  'the-tide': 'flow',
  'the-ebb': 'flow',
  'the-drift': 'flow',
  'the-surge': 'flow',
  'the-whisper': 'flow',
  'the-breaker': 'flow',
  'the-shadow': 'void',
  'the-pause': 'void',
  'the-abyss': 'void',
  'the-fog': 'void',
  'the-silence': 'void',
  'the-stillness': 'void',
  'the-veil': 'void',
  'the-glow': 'light',
  'the-halo': 'light',
  'the-lantern': 'light',
  'the-sun': 'light',
  'the-star': 'light',
  'the-prism': 'light',
  'the-beam': 'light',
  'the-initiate': 'archetypes',
  'the-path': 'archetypes',
  'the-crossing': 'archetypes',
  'the-sanctuary': 'archetypes',
  'the-echo': 'archetypes',
  'the-pulse': 'archetypes',
  'the-flame': 'archetypes',
  'the-watcher': 'archetypes',
  'the-wave': 'archetypes',
  'the-weaver': 'archetypes',
  'the-witness': 'archetypes',
  'the-mirror': 'archetypes',
  'the-return': 'archetypes',
  'the-bridge': 'archetypes',
  'the-messenger': 'archetypes',
  'the-guardian': 'archetypes',
  'the-lightkeeper': 'archetypes',
  'the-spiral': 'archetypes',
  'the-teardrop': 'archetypes',
  'the-teardrop-bearer': 'archetypes',
  'the-vessel': 'archetypes',
} as const

export type TeardropFolderPhase =
  (typeof TEARDROP_SLUG_TO_FOLDER_PHASE)[keyof typeof TEARDROP_SLUG_TO_FOLDER_PHASE]

const DIR_BY_PHASE: Record<TeardropFolderPhase, string> = {
  roots: '1_TEARDROP_ROOTS_CARDS',
  flow: '2_TEARDROP_FLOW_CARDS',
  void: '3_TEARDROP_VOID_CARDS',
  light: '4_TEARDROP_LIGHT_CARDS',
  archetypes: '5_TEARDROP_ARCHETYPES_CARDS',
}

export function teardropDocsSubdirForSlug(slug: string): string | null {
  const p =
    TEARDROP_SLUG_TO_FOLDER_PHASE[slug as keyof typeof TEARDROP_SLUG_TO_FOLDER_PHASE]
  return p ? (DIR_BY_PHASE[p] ?? null) : null
}
