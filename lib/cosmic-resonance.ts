export type CosmicPlanetId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'

export type CosmicInfluence = {
  id: CosmicPlanetId
  symbol: string
  orbitalDays: number
  noteShort: string
  archetype: string
  energy: string
  rhythm: string
  emotionalInfluence: string
  name: {
    en: string
    pl: string
  }
}

const COSMIC_INFLUENCES: CosmicInfluence[] = [
  {
    id: 'mercury',
    symbol: '☿',
    orbitalDays: 87.97,
    noteShort: 'D#',
    archetype: 'The Spark',
    energy: 'quick awakenings',
    rhythm: 'impulse to motion',
    emotionalInfluence: 'first ignition',
    name: { en: 'Mercury', pl: 'Merkury' },
  },
  {
    id: 'venus',
    symbol: '♀',
    orbitalDays: 224.7,
    noteShort: 'A',
    archetype: 'The Heart',
    energy: 'warmth',
    rhythm: 'attraction',
    emotionalInfluence: 'human closeness',
    name: { en: 'Venus', pl: 'Wenus' },
  },
  {
    id: 'earth',
    symbol: '🌍',
    orbitalDays: 365.25,
    noteShort: 'C#',
    archetype: 'The Blade',
    energy: 'presence',
    rhythm: 'cycle of return',
    emotionalInfluence: 'grounding in life',
    name: { en: 'Earth', pl: 'Ziemia' },
  },
  {
    id: 'mars',
    symbol: '♂',
    orbitalDays: 686.97,
    noteShort: 'G#',
    archetype: 'The Flame',
    energy: 'tension to action',
    rhythm: 'decision pulse',
    emotionalInfluence: 'courage to move',
    name: { en: 'Mars', pl: 'Mars' },
  },
  {
    id: 'jupiter',
    symbol: '♃',
    orbitalDays: 4332.59,
    noteShort: 'E',
    archetype: 'The Bloom',
    energy: 'expansion',
    rhythm: 'opening',
    emotionalInfluence: 'more life',
    name: { en: 'Jupiter', pl: 'Jowisz' },
  },
  {
    id: 'saturn',
    symbol: '♄',
    orbitalDays: 10759.2,
    noteShort: 'F',
    archetype: 'The Keeper',
    energy: 'structure',
    rhythm: 'boundary cycle',
    emotionalInfluence: 'shelter and responsibility',
    name: { en: 'Saturn', pl: 'Saturn' },
  },
  {
    id: 'uranus',
    symbol: '♅',
    orbitalDays: 30688.5,
    noteShort: 'C#',
    archetype: 'The Blade',
    energy: 'breakthrough',
    rhythm: 'sudden shift',
    emotionalInfluence: 'pattern release',
    name: { en: 'Uranus', pl: 'Uran' },
  },
  {
    id: 'neptune',
    symbol: '♆',
    orbitalDays: 60195.0,
    noteShort: 'G',
    archetype: 'The River',
    energy: 'dissolution',
    rhythm: 'flow state',
    emotionalInfluence: 'softening control',
    name: { en: 'Neptune', pl: 'Neptun' },
  },
]

export function getCosmicInfluenceForNoteShort(noteShort: string): CosmicInfluence[] {
  return COSMIC_INFLUENCES.filter((p) => p.noteShort === noteShort)
}

export function getPrimaryCosmicInfluenceForNoteShort(
  noteShort: string,
): CosmicInfluence | undefined {
  return getCosmicInfluenceForNoteShort(noteShort)[0]
}

export function getCosmicAudioFrequencyHz(orbitalDays: number): number {
  if (!Number.isFinite(orbitalDays) || orbitalDays <= 0) return 220
  let hz = orbitalDays
  while (hz < 90) hz *= 2
  while (hz > 520) hz /= 2
  return hz
}

