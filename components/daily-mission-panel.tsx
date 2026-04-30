'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { hexToRgba } from '@/lib/hex-rgba'
import type { DailyMission, DailyMissionItem } from '@/lib/validators/daily-mission'

type Props = {
  mission: DailyMission
  onItemFocus: (item: DailyMissionItem) => void
}

function MissionRow({
  item,
  onFocus,
}: {
  item: DailyMissionItem
  onFocus: () => void
}) {
  const t = useTranslations('dailyMission')
  const revealed = item.completedAt !== null
  const c = item.noteChromaHex
  const isShadow = item.kind === 'shadow'

  return (
    <button
      type="button"
      onClick={onFocus}
      className={cn(
        'group relative flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-shadow duration-300',
        'hover:shadow-[0_4px_18px_-10px_rgba(15,23,42,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/15 focus-visible:ring-offset-2 focus-visible:ring-offset-pearl',
        revealed && 'opacity-70',
      )}
      style={{
        backgroundColor: hexToRgba(c, revealed ? 0.06 : isShadow ? 0.04 : 0.05),
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: hexToRgba(c, revealed ? 0.32 : isShadow ? 0.28 : 0.2),
      }}
      aria-label={t('focusItemAria', { note: item.noteShort })}
    >
      <div className="mt-1 flex h-3 w-3 shrink-0 items-center justify-center">
        <span
          className="block h-2.5 w-2.5 rounded-full transition-all duration-500"
          style={{
            backgroundColor: revealed ? c : 'transparent',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: hexToRgba(c, revealed ? 1 : isShadow ? 0.5 : 0.4),
          }}
          aria-hidden
        />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="truncate text-lora text-[0.92rem] leading-tight"
          style={{ color: c }}
        >
          {item.noteSynestheticTitle}
        </p>

        <p className="mt-0.5 truncate font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ink-muted">
          {item.noteShort}
          {item.noteEmotionName ? <> · {item.noteEmotionName}</> : null}
          {item.noteElement ? <> · {item.noteElement}</> : null}
        </p>

        {item.teardropCardName && (
          <p className="mt-1 truncate text-lora text-[0.72rem] italic leading-snug text-ink/70">
            <span className="opacity-60">→ </span>
            {item.teardropCardName}
            {item.teardropCardTagline ? (
              <span className="text-ink/55"> · {item.teardropCardTagline}</span>
            ) : null}
          </p>
        )}

        <div
          className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-pearl-border/60"
          role="progressbar"
          aria-valuenow={item.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${item.progressPercent}%`,
              backgroundColor: c,
              opacity: revealed ? 0.45 : 0.85,
            }}
          />
        </div>
      </div>
    </button>
  )
}

function PresenceDots({
  items,
  kind,
}: {
  items: DailyMissionItem[]
  kind: 'light' | 'shadow'
}) {
  if (items.length === 0) return null
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {items.map((it) => {
        const filled = it.completedAt !== null
        return (
          <span
            key={it.id}
            className="block h-1.5 w-1.5 rounded-full transition-all duration-700"
            style={{
              backgroundColor: filled ? it.noteChromaHex : 'transparent',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: hexToRgba(
                it.noteChromaHex,
                filled ? 1 : kind === 'shadow' ? 0.4 : 0.3,
              ),
            }}
          />
        )
      })}
    </div>
  )
}

function MissionSection({
  kind,
  items,
  onItemFocus,
}: {
  kind: 'light' | 'shadow'
  items: DailyMissionItem[]
  onItemFocus: (item: DailyMissionItem) => void
}) {
  const t = useTranslations('dailyMission')
  const heading = kind === 'light' ? t('lightHeader') : t('shadowHeader')
  const whisper = kind === 'light' ? t('lightWhisper') : t('shadowWhisper')
  const empty = kind === 'light' ? t('lightEmpty') : t('shadowEmpty')

  return (
    <div className="relative">
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-px',
          kind === 'light'
            ? 'bg-gradient-to-b from-transparent via-amber-300/30 to-transparent'
            : 'bg-gradient-to-b from-transparent via-ink/15 to-transparent',
        )}
        aria-hidden
      />
      <div className="pl-4">
        <div className="flex items-baseline justify-between gap-3">
          <p
            className={cn(
              'font-mono text-[0.62rem] font-semibold uppercase tracking-[0.22em]',
              kind === 'light' ? 'text-ink' : 'text-ink/85',
            )}
          >
            <span aria-hidden className="mr-2 select-none">
              {kind === 'light' ? '◌' : '●'}
            </span>
            {heading}
          </p>
          <PresenceDots items={items} kind={kind} />
        </div>
        <p className="text-lora mt-1.5 text-[0.72rem] italic leading-snug text-ink/70">
          {whisper}
        </p>

        {items.length === 0 ? (
          <div className="mt-3 space-y-1">
            <p className="text-lora text-[0.72rem] italic text-ink-muted">{empty}</p>
            {kind === 'shadow' && (
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-ink-muted/70">
                {t('silenceVerse')}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {items.map((item) => (
              <MissionRow
                key={item.id}
                item={item}
                onFocus={() => onItemFocus(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function DailyMissionPanel({ mission, onItemFocus }: Props) {
  const t = useTranslations('dailyMission')
  const allRevealed = mission.allDone
  const lightItems = mission.items.filter((i) => i.kind === 'light')
  const shadowItems = mission.items.filter((i) => i.kind === 'shadow')

  return (
    <div role="region" aria-label={t('kicker')}>
      <p className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">
        {t('kicker')}
      </p>
      <p className="text-lora mt-2 text-lg font-light text-ink">
        {allRevealed ? t('allRevealedShort') : t('title')}
      </p>

      {!allRevealed && mission.items.length > 0 && (
        <p className="text-lora mt-2 text-sm italic leading-relaxed text-ink/75">
          {t('subtitle')}
        </p>
      )}

      {mission.items.length === 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-lora text-sm italic text-ink-muted">{t('emptyAllUnlocked')}</p>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-muted/70">
            {t('silenceVerse')}
          </p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-6">
          <MissionSection kind="light" items={lightItems} onItemFocus={onItemFocus} />
          <MissionSection kind="shadow" items={shadowItems} onItemFocus={onItemFocus} />
        </div>
      )}

      {allRevealed && mission.items.length > 0 && (
        <p className="text-lora mt-5 text-center text-sm italic text-ink/75">
          {t('completionWhisper')}
        </p>
      )}
    </div>
  )
}
