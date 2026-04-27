import { Suspense } from 'react'
import { LoginForm } from './login-form'

function LoginFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="lore-card w-full max-w-sm">
        <p className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted mb-5">
          Soundie
        </p>
        <p className="font-mono text-sm text-ink-muted">…</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
