import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function getMetrics() {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

  const [
    totalPlayers,
    newPlayersLast24h,
    newPlayersPrev24h,
    sessionAgg,
    shareClicks,
    shareCompletes,
  ] = await Promise.all([
    db.player.count(),
    db.player.count({ where: { createdAt: { gte: yesterday } } }),
    db.player.count({ where: { createdAt: { gte: twoDaysAgo, lt: yesterday } } }),
    db.listenSession.aggregate({ _avg: { duration: true } }),
    db.analyticsEvent.count({ where: { name: 'share_click' } }),
    db.analyticsEvent.count({ where: { name: 'share_complete' } }),
  ])

  const d1Retention =
    newPlayersPrev24h > 0
      ? Math.round((newPlayersLast24h / newPlayersPrev24h) * 100 * 10) / 10
      : null

  const avgSec = Math.round(sessionAgg._avg.duration ?? 0)
  const avgMin = Math.floor(avgSec / 60)
  const avgRemSec = avgSec % 60

  return {
    totalPlayers,
    newPlayersLast24h,
    d1RetentionPercent: d1Retention,
    avgSession: avgSec > 0 ? `${avgMin}m ${avgRemSec}s` : '—',
    shareClicks,
    shareCompletes,
  }
}

interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}

function MetricCard({ label, value, sub, accent }: MetricCardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent
          ? 'border-coral/40 bg-coral/5'
          : 'border-pearl-border bg-pearl-dark'
      }`}
    >
      <p className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted mb-1">
        {label}
      </p>
      <p className="font-mono text-3xl font-bold text-ink">{value}</p>
      {sub && (
        <p className="font-mono text-[0.65rem] text-ink-muted mt-1">{sub}</p>
      )}
    </div>
  )
}

export default async function AdminPage() {
  const m = await getMetrics()

  return (
    <main className="min-h-screen bg-pearl px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted mb-1">
            Soundie
          </p>
          <h1 className="font-mono text-2xl font-bold text-ink">
            Founder Dashboard
          </h1>
          <p className="font-mono text-xs text-ink-muted mt-1">
            Day 30 metrics · live
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <MetricCard
            label="D1 Retention"
            value={m.d1RetentionPercent !== null ? `${m.d1RetentionPercent}%` : '—'}
            sub="new users returning next day"
            accent={m.d1RetentionPercent !== null && m.d1RetentionPercent >= 30}
          />
          <MetricCard
            label="Avg Session"
            value={m.avgSession}
            sub="across all listen sessions"
          />
          <MetricCard
            label="New Users (24h)"
            value={m.newPlayersLast24h}
            sub={`total: ${m.totalPlayers} players`}
          />
          <MetricCard
            label="Shares"
            value={m.shareClicks}
            sub={`${m.shareCompletes} completed`}
          />
        </div>

        <div className="rounded-2xl border border-pearl-border bg-pearl-dark p-5">
          <p className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted mb-3">
            Raw numbers
          </p>
          <div className="space-y-2">
            {[
              ['Total players', m.totalPlayers],
              ['New (last 24h)', m.newPlayersLast24h],
              ['D1 retention', m.d1RetentionPercent !== null ? `${m.d1RetentionPercent}%` : 'not enough data'],
              ['Avg session', m.avgSession],
              ['share_click events', m.shareClicks],
              ['share_complete events', m.shareCompletes],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between items-center">
                <span className="font-mono text-xs text-ink-muted">{k}</span>
                <span className="font-mono text-xs font-semibold text-ink">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 font-mono text-[0.6rem] text-ink-muted text-center">
          Refreshed at {new Date().toLocaleString('pl-PL')} · /admin
        </p>
      </div>
    </main>
  )
}
