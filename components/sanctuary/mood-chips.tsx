'use client'

import { useTranslations } from 'next-intl'
import { MOOD_ID_LIST } from '@/lib/mood-reaction-texts'

type Point = { entryDate: string; mood: string }

const MOOD_HUE: Record<string, number> = {
  anxious: 12,
  numb: 220,
  heavy: 28,
  scattered: 160,
  hopeful: 45,
}

export function MoodChips({ data }: { data: Point[] }) {
  const t = useTranslations('sanctuary')

  const counts = new Map<string, number>()
  for (const m of MOOD_ID_LIST) counts.set(m, 0)
  for (const row of data) {
    if (counts.has(row.mood)) {
      counts.set(row.mood, (counts.get(row.mood) ?? 0) + 1)
    }
  }

  const rows = MOOD_ID_LIST.map((m) => ({ id: m, count: counts.get(m) ?? 0 }))
  const max = Math.max(...rows.map((r) => r.count), 1)

  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label={t('moodAria')}>
      {rows.map(({ id, count }) => {
        const hue = MOOD_HUE[id] ?? 200
        const active = count > 0
        return (
          <div
            key={id}
            role="listitem"
            className="flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors"
            style={{
              backgroundColor: `hsl(${hue} 32% ${active ? 93 : 97}%)`,
              borderColor: `hsl(${hue} 24% ${active ? 80 : 90}%)`,
              opacity: active ? 1 : 0.5,
            }}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: `hsl(${hue} 48% 60%)` }}
              aria-hidden
            />
            <span className="font-mono text-[0.65rem] text-ink/80">
              {t(`moodLabels.${id}` as 'moodLabels.anxious')}
            </span>
            {active && (
              <span
                className="font-mono text-[0.62rem] font-semibold"
                style={{ color: `hsl(${hue} 38% 40%)` }}
              >
                {count}
              </span>
            )}
          </div>
        )
      })}
      {rows.every((r) => r.count === 0) && (
        <p className="font-body-serif text-sm text-ink/80">{t('emptyMood')}</p>
      )}
    </div>
  )
}
