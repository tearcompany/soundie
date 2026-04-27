'use client'

import { useState, useRef } from 'react'
import { isTRPCClientError } from '@trpc/client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { defaultAuthedPathForLocale, safePathRedirect } from '@/lib/auth-routes'
import { trpc } from '@/lib/trpc/react'

type Step = 'email' | 'code'

export function LoginForm() {
  const t = useTranslations('auth')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const requestOtp = trpc.otp.request.useMutation()
  const verifyOtp = trpc.otp.verify.useMutation()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  const afterSignIn = () => {
    const callback = searchParams.get('callbackUrl')
    const fallback = defaultAuthedPathForLocale(pathname ?? '/login')
    const nextPath = safePathRedirect(callback, fallback)
    router.replace(nextPath)
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const normalized = email.toLowerCase().trim()
    if (!normalized.includes('@')) {
      setError(t('errInvalidEmail'))
      return
    }
    setLoading(true)
    try {
      await requestOtp.mutateAsync({ email: normalized })
      setEmail(normalized)
      setStep('code')
      setTimeout(() => codeRef.current?.focus(), 50)
    } catch (e) {
      if (isTRPCClientError(e)) {
        if (e.message === 'email_not_configured') setError(t('errEmailConfig'))
        else if (e.message === 'email_smtp_unreachable') {
          setError(t('errEmailSmtpUnreachable'))
        } else if (e.message === 'email_send_failed') setError(t('errEmailSend'))
        else if (e.data?.zodError) {
          setError(t('errInvalidEmail'))
        } else setError(t('errGeneric'))
      } else {
        setError(t('errNetwork'))
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await verifyOtp.mutateAsync({ email, code })
      const result = await signIn('credentials', { email, redirect: false })
      if (result?.error) {
        setError(t('errSignIn'))
        return
      }
      afterSignIn()
    } catch (e) {
      if (isTRPCClientError(e)) {
        if (e.message === 'Code expired') setError(t('errCodeExpired'))
        else if (e.message === 'Invalid code') setError(t('errInvalidCode'))
        else if (e.data?.zodError) {
          setError(t('errInvalidCode'))
        } else setError(t('errGeneric'))
      } else {
        setError(t('errNetwork'))
      }
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
              <p className="text-lora text-lg font-light text-ink mb-1">{t('emailLabel')}</p>
              <p className="font-mono text-[0.65rem] text-ink-muted">{t('emailHint')}</p>
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
              {loading ? t('sending') : t('sendCode')}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
            <div>
              <p className="text-lora text-lg font-light text-ink mb-1">{t('checkInbox')}</p>
              <p className="font-mono text-[0.65rem] text-ink-muted">
                {t('sentTo', { email })}
              </p>
            </div>
            <Input
              ref={codeRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder={t('codePlaceholder')}
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
              {loading ? t('verifying') : t('verifyCta')}
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
              {t('changeEmail')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
