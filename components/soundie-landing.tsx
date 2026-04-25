import Link from 'next/link'

export function SoundieLanding() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-pearl-border/60 bg-pearl/80 px-6 py-5 backdrop-blur-sm">
        <p className="text-center font-[family-name:var(--font-fraunces,serif)] text-2xl font-semibold tracking-tight text-ink">
          Soundie
        </p>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-24 pt-16 sm:pt-24">
        <p className="text-center font-mono text-xs uppercase tracking-[0.2em] text-coral">
          Presence Pass
        </p>
        <h1 className="mt-4 text-center font-[family-name:var(--font-fraunces,serif)] text-4xl font-bold leading-tight text-ink sm:text-5xl">
          A system-wide refinement layer that makes sound feel alive.
        </h1>
        <p className="mt-6 text-center font-[family-name:var(--font-lora,serif)] text-lg leading-relaxed text-ink-muted">
          Soundie is not built to demand attention. It is built to hold presence. Every note, motion, glow, and
          breath is refined until sound stops feeling like interface and starts feeling alive.
        </p>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <Link
            href="/play"
            className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-coral px-8 py-4 font-mono text-sm font-semibold text-pearl shadow-lg transition-all hover:bg-coral-light hover:shadow-xl"
          >
            Enter the first note
          </Link>
          <Link
            href="/play?note=C"
            className="font-mono text-sm text-ink underline-offset-4 transition-colors hover:text-coral hover:underline"
          >
            C — The Foundation
          </Link>
        </div>

        <section className="mt-24 space-y-10">
          <div className="rounded-2xl border border-pearl-border bg-pearl-dark/50 p-6 sm:p-8">
            <h2 className="font-[family-name:var(--font-fraunces,serif)] text-xl font-semibold text-ink">
              Tamagotchi for the soul
            </h2>
            <p className="mt-3 font-[family-name:var(--font-lora,serif)] text-ink-muted leading-relaxed">
              Twelve living notes, each with lore, frequency, and colour. You listen, they grow, you settle. The
              more you return, the more the world opens — chords, sessions, and presence that deepens with time.
            </p>
          </div>
          <div className="rounded-2xl border border-pearl-border bg-pearl-dark/50 p-6 sm:p-8">
            <h2 className="font-[family-name:var(--font-fraunces,serif)] text-xl font-semibold text-ink">
              One stack, two homes
            </h2>
            <p className="mt-3 font-[family-name:var(--font-lora,serif)] text-ink-muted leading-relaxed">
              Next.js on the web, React Native / Expo on mobile. Shared logic, one voice. Presence Pass is the
              bar every surface must pass before a feature ships: does it make the note more present, or only
              busier?
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-pearl-border px-6 py-8 text-center">
        <p className="font-mono text-xs text-ink-muted">Soundie — heal with living notes.</p>
      </footer>
    </div>
  )
}
