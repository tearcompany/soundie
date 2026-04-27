import { readdirSync, readFileSync, writeFileSync, type Dirent } from 'fs'
import { join } from 'path'
import {
  type TeardropFolderPhase,
  TEARDROP_SLUG_TO_FOLDER_PHASE,
  teardropDocsSubdirForSlug,
} from '../lib/teardrop-deck-phases'

const ROOT = join(__dirname, '..', 'docs', 'Cards')
const OUT = join(__dirname, '..', 'data', 'teardrop-card-texts-pl.json')

const DIRS: [string, TeardropFolderPhase][] = [
  ['1_TEARDROP_ROOTS_CARDS', 'roots'],
  ['2_TEARDROP_FLOW_CARDS', 'flow'],
  ['3_TEARDROP_VOID_CARDS', 'void'],
  ['4_TEARDROP_LIGHT_CARDS', 'light'],
  ['5_TEARDROP_ARCHETYPES_CARDS', 'archetypes'],
]

function fileNameToSlug(name: string): string | null {
  if (name === 'Readme.md') return null
  if (!name.endsWith('.md')) return null
  let b = name.replace(/\.md$/i, '')
  if (b.startsWith('LIGHT_')) b = b.slice(6)
  if (!b.startsWith('The_')) return null
  return b
    .replace(/^The_/, 'the-')
    .replace(/_/g, '-')
    .toLowerCase()
}

function cleanQuotes(s: string) {
  return s
    .trim()
    .replace(/^["„\s]+/, '')
    .replace(/["”\s]+$/, '')
}

function extractTagline(text: string): string {
  const m = text.match(/\*\*Hasło przewodnie:\*\*\s*([^\n]+)/)
  if (!m) return ''
  return cleanQuotes(m[1] ?? '')
}

function extractDescription(text: string): string {
  const m = text.match(
    /## Opis Karty\s*\n+([\s\S]*?)(?=\n---\s*\n## Znaczenie|\n## Znaczenie w Rozkładzie)/,
  )
  return (m?.[1] ?? '').trim().replace(/\n{3,}/g, '\n\n')
}

function linesFromSection(body: string): string {
  if (!body) return ''
  return body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('-'))
    .map((l) => l.replace(/^-+\s*/, ''))
    .join('\n')
}

function extractUpright(text: string): string {
  const m = text.match(
    /\*\*Pozytywnie:\*\*([\s\S]*?)(?=\*\*Negatywnie[^*]*\*\*)/,
  )
  return linesFromSection(m?.[1] ?? '')
}

function extractShadow(text: string): string {
  const m = text.match(
    /\*\*Negatywnie[^*]*\*\*([\s\S]*?)(?=\n---\s*\n## Afirmacja|\n## Afirmacja)/,
  )
  return linesFromSection(m?.[1] ?? '')
}

function extractAffirmation(text: string): string {
  const m = text.match(
    /## Afirmacja\s*\n+([\s\S]*?)(?=\n---\s*\n## |$)/,
  )
  let a = (m?.[1] ?? '').trim()
  const cut = a.search(/\n---\s*\n/)
  if (cut !== -1) a = a.slice(0, cut).trim()
  if (a.includes('\n## Elementy')) a = a.split('\n## Elementy')[0] ?? a
  a = a.split('\n').filter((l) => !/^\s*##\s/.test(l)).join('\n').trim()
  return cleanQuotes(a)
}

type Block = {
  tagline: string
  description: string
  meaningUpright: string
  meaningShadow: string
  affirmation: string
}

function parseBody(raw: string): Block {
  const t = raw.replace(/\r\n/g, '\n')
  return {
    tagline: extractTagline(t),
    description: extractDescription(t),
    meaningUpright: extractUpright(t),
    meaningShadow: extractShadow(t),
    affirmation: extractAffirmation(t),
  }
}

const expectedSlugs = new Set(
  Object.keys(TEARDROP_SLUG_TO_FOLDER_PHASE) as string[],
)
const bySlug = new Map<string, { rel: string; block: Block }>()

for (const [sub, dirPhase] of DIRS) {
  const d = join(ROOT, sub)
  let names: Dirent[]
  try {
    names = readdirSync(d, { withFileTypes: true })
  } catch {
    console.error(`[sync-teardrop] missing dir: ${d}`)
    continue
  }
  for (const ent of names) {
    if (ent.isDirectory()) continue
    const slug = fileNameToSlug(ent.name)
    if (!slug || !expectedSlugs.has(slug)) continue
    const cardPhase = TEARDROP_SLUG_TO_FOLDER_PHASE[
      slug as keyof typeof TEARDROP_SLUG_TO_FOLDER_PHASE
    ]
    if (cardPhase !== dirPhase) continue
    const raw = readFileSync(join(d, ent.name), 'utf8')
    const block = parseBody(raw)
    bySlug.set(slug, { rel: join(sub, ent.name), block })
  }
}

const allSlugs = Object.keys(TEARDROP_SLUG_TO_FOLDER_PHASE) as string[]
const plOut: Record<string, Block> = {}

for (const slug of allSlugs) {
  const b = bySlug.get(slug)
  if (!b) {
    console.error(
      `[sync-teardrop] missing PL doc for: ${slug} (expected folder: ${teardropDocsSubdirForSlug(slug) ?? '?'})`,
    )
    plOut[slug] = {
      tagline: '',
      description: '',
      meaningUpright: '',
      meaningShadow: '',
      affirmation: '',
    }
    continue
  }
  plOut[slug] = b.block
  if (!b.block.tagline || !b.block.description || !b.block.affirmation) {
    console.warn(`[sync-teardrop] sparse: ${slug} (from ${b.rel})`)
  }
}

writeFileSync(OUT, JSON.stringify(plOut, null, 2) + '\n', 'utf8')
console.log(
  `[sync-teardrop] wrote ${allSlugs.length} slugs to data/teardrop-card-texts-pl.json`,
)
