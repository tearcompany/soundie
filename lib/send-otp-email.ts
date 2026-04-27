import { Resend } from 'resend'
import nodemailer from 'nodemailer'

function buildHtml(code: string, expiryMinutes: number) {
  return `
        <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:32px">
          <p style="font-size:13px;color:#6b6057;text-transform:uppercase;letter-spacing:.12em">Soundie</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:.08em;color:#1a1410">${code}</p>
          <p style="font-size:14px;color:#6b6057">Kod ważny przez ${expiryMinutes} minut. Jeśli to nie ty — zignoruj tę wiadomość.</p>
        </div>
      `
}

function resolveFrom(): string {
  const direct = process.env.EMAIL_FROM?.trim()
  if (direct) return direct
  const smtpUser = process.env.SMTP_USER?.trim()
  if (smtpUser && smtpUser.includes('@')) return `Soundie <${smtpUser}>`
  const domain = process.env.RESEND_FROM_DOMAIN?.trim()
  if (domain) return `Soundie <no-reply@${domain}>`
  return 'Soundie <onboarding@resend.dev>'
}

export async function sendOtpEmail(input: { to: string; code: string; expiryMinutes: number }) {
  const { to, code, expiryMinutes } = input
  const subject = `Twój kod logowania — ${code}`
  const html = buildHtml(code, expiryMinutes)
  const from = resolveFrom()

  if (process.env.SMTP_HOST) {
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465
    const secure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1'
      : port === 465
    const connMs = Number(process.env.SMTP_CONNECTION_TIMEOUT_MS)
    const connectionTimeout = Number.isFinite(connMs) && connMs > 0 ? connMs : 25_000
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      connectionTimeout,
      greetingTimeout: Math.min(connectionTimeout, 25_000),
      socketTimeout: Math.min(connectionTimeout + 15_000, 60_000),
      auth: {
        user: process.env.SMTP_USER ?? '',
        pass: process.env.SMTP_PASS ?? '',
      },
    })
    await transporter.sendMail({ from, to, subject, html })
    return
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const out = await resend.emails.send({ from, to, subject, html })
    if (out.error) {
      throw new Error(out.error.message)
    }
    return
  }

  console.log(`[OTP dev] code for ${to}: ${code}`)
}
