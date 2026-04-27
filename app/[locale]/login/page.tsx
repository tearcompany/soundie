'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Step = 'email' | 'code'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp?action=request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Coś poszło nie tak')
        return
      }
      setStep('code')
      setTimeout(() => codeRef.current?.focus(), 50)
    } catch {
      setError('Błąd sieci — spróbuj ponownie')
    } finally {
      setLoading(false)
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp?action=verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error === 'Code expired' ? 'Kod wygasł — wyślij nowy' : 'Nieprawidłowy kod')
        return
      }
      const result = await signIn('credentials', { email, redirect: false })
      if (result?.error) {
        setError('Nie udało się zalogować — spróbuj ponownie')
        return
      }
      router.replace('/play')
    } catch {
      setError('Błąd sieci — spróbuj ponownie')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="lore-card w-full max-w-sm">
        <p className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted mb-5">
          Soundie
        </p>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <div>
              <p className="text-lora text-lg font-light text-ink mb-1">Wpisz swój adres email</p>
              <p className="font-mono text-[0.65rem] text-ink-muted">
                Wyślemy Ci 6-cyfrowy kod. Bez haseł.
              </p>
            </div>
            <Input
              type="email"
              placeholder="ty@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              className="font-mono text-sm"
            />
            {error && (
              <p className="font-mono text-[0.65rem] text-coral-dark">{error}</p>
            )}
            <Button type="submit" disabled={loading || !email} className="w-full">
              {loading ? 'Wysyłanie…' : 'Wyślij kod'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
            <div>
              <p className="text-lora text-lg font-light text-ink mb-1">Sprawdź skrzynkę</p>
              <p className="font-mono text-[0.65rem] text-ink-muted">
                Wysłaliśmy kod na <span className="text-ink">{email}</span>
              </p>
            </div>
            <Input
              ref={codeRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              autoComplete="one-time-code"
              className="font-mono text-2xl tracking-[0.4em] text-center"
            />
            {error && (
              <p className="font-mono text-[0.65rem] text-coral-dark">{error}</p>
            )}
            <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
              {loading ? 'Weryfikacja…' : 'Zaloguj się'}
            </Button>
            <button
              type="button"
              className="font-mono text-[0.65rem] text-ink-muted underline-offset-2 hover:underline"
              onClick={() => {
                setStep('email')
                setCode('')
                setError(null)
              }}
            >
              Zmień adres email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
