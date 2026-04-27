export type TeardropCardMeta = {
  slug: string
  name: string
  phase: string | null
  phaseOrder: number | null
  arcanaType: 'major' | 'minor' | 'special'
  suit: string | null
  cardNumber: number | null
}

export const TEARDROP_CARDS: TeardropCardMeta[] = [
  { slug: 'the-seed', name: 'The Seed', phase: 'roots', phaseOrder: 1, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-soil', name: 'The Soil', phase: 'roots', phaseOrder: 2, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-anchor', name: 'The Anchor', phase: 'roots', phaseOrder: 3, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-shell', name: 'The Shell', phase: 'roots', phaseOrder: 4, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-core', name: 'The Core', phase: 'roots', phaseOrder: 5, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-stone', name: 'The Stone', phase: 'roots', phaseOrder: 6, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-branch', name: 'The Branch', phase: 'roots', phaseOrder: 7, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-tree', name: 'The Tree', phase: 'roots', phaseOrder: 8, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-stream', name: 'The Stream', phase: 'flow', phaseOrder: 1, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-tide', name: 'The Tide', phase: 'flow', phaseOrder: 2, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-ebb', name: 'The Ebb', phase: 'flow', phaseOrder: 3, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-drift', name: 'The Drift', phase: 'flow', phaseOrder: 4, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-surge', name: 'The Surge', phase: 'flow', phaseOrder: 5, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-whisper', name: 'The Whisper', phase: 'flow', phaseOrder: 6, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-breaker', name: 'The Breaker', phase: 'flow', phaseOrder: 7, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-shadow', name: 'The Shadow', phase: 'void', phaseOrder: 1, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-pause', name: 'The Pause', phase: 'void', phaseOrder: 2, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-abyss', name: 'The Abyss', phase: 'void', phaseOrder: 3, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-fog', name: 'The Fog', phase: 'void', phaseOrder: 4, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-silence', name: 'The Silence', phase: 'void', phaseOrder: 5, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-stillness', name: 'The Stillness', phase: 'void', phaseOrder: 6, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-veil', name: 'The Veil', phase: 'void', phaseOrder: 7, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-glow', name: 'The Glow', phase: 'light', phaseOrder: 1, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-halo', name: 'The Halo', phase: 'light', phaseOrder: 2, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-lantern', name: 'The Lantern', phase: 'light', phaseOrder: 3, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-sun', name: 'The Sun', phase: 'light', phaseOrder: 4, arcanaType: 'major', suit: null, cardNumber: null },
  { slug: 'the-star', name: 'The Star', phase: 'light', phaseOrder: 5, arcanaType: 'major', suit: null, cardNumber: null },
  { slug: 'the-prism', name: 'The Prism', phase: 'light', phaseOrder: 6, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-beam', name: 'The Beam', phase: 'light', phaseOrder: 7, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-initiate', name: 'The Initiate', phase: 'archetypes', phaseOrder: 1, arcanaType: 'major', suit: null, cardNumber: null },
  { slug: 'the-path', name: 'The Path', phase: 'archetypes', phaseOrder: 2, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-crossing', name: 'The Crossing', phase: 'archetypes', phaseOrder: 3, arcanaType: 'major', suit: null, cardNumber: null },
  { slug: 'the-sanctuary', name: 'The Sanctuary', phase: 'archetypes', phaseOrder: 4, arcanaType: 'major', suit: null, cardNumber: null },
  { slug: 'the-echo', name: 'The Echo', phase: 'archetypes', phaseOrder: 5, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-pulse', name: 'The Pulse', phase: 'archetypes', phaseOrder: 6, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-flame', name: 'The Flame', phase: 'archetypes', phaseOrder: 7, arcanaType: 'major', suit: null, cardNumber: null },
  { slug: 'the-watcher', name: 'The Watcher', phase: 'archetypes', phaseOrder: 8, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-wave', name: 'The Wave', phase: 'archetypes', phaseOrder: 9, arcanaType: 'minor', suit: null, cardNumber: null },
  { slug: 'the-weaver', name: 'The Weaver', phase: 'archetypes', phaseOrder: 10, arcanaType: 'major', suit: null, cardNumber: null },
  { slug: 'the-witness', name: 'The Witness', phase: 'archetypes', phaseOrder: 11, arcanaType: 'major', suit: null, cardNumber: null },
  { slug: 'the-mirror', name: 'The Mirror', phase: 'archetypes', phaseOrder: 12, arcanaType: 'major', suit: null, cardNumber: null },
  { slug: 'the-return', name: 'The Return', phase: 'archetypes', phaseOrder: 13, arcanaType: 'major', suit: null, cardNumber: null },
  { slug: 'the-bridge', name: 'The Bridge', phase: 'archetypes', phaseOrder: 14, arcanaType: 'major', suit: null, cardNumber: null },
  { slug: 'the-messenger', name: 'The Messenger', phase: 'archetypes', phaseOrder: 15, arcanaType: 'major', suit: null, cardNumber: null },
  { slug: 'the-guardian', name: 'The Guardian', phase: 'archetypes', phaseOrder: 16, arcanaType: 'major', suit: null, cardNumber: null },
  { slug: 'the-lightkeeper', name: 'The Lightkeeper', phase: 'archetypes', phaseOrder: 17, arcanaType: 'major', suit: null, cardNumber: null },
  { slug: 'the-spiral', name: 'The Spiral', phase: 'archetypes', phaseOrder: 18, arcanaType: 'major', suit: null, cardNumber: null },
  { slug: 'the-teardrop', name: 'The Teardrop', phase: 'archetypes', phaseOrder: 20, arcanaType: 'special', suit: null, cardNumber: null },
  { slug: 'the-teardrop-bearer', name: 'The Teardrop Bearer', phase: 'archetypes', phaseOrder: 21, arcanaType: 'special', suit: null, cardNumber: null },
  { slug: 'the-vessel', name: 'The Vessel', phase: 'archetypes', phaseOrder: 22, arcanaType: 'major', suit: null, cardNumber: null },
]
