import { Resend } from 'resend'

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
  return process.env.EMAIL_FROM?.trim() ?? 'Soundie <me@soundie.world>'
}

export async function sendOtpEmail(input: { to: string; code: string; expiryMinutes: number }) {
  const { to, code, expiryMinutes } = input

  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[OTP dev] ${to} → ${code}`)
      return
    }
    throw new Error('RESEND_API_KEY not configured')
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const out = await resend.emails.send({
    from: resolveFrom(),
    to,
    subject: `Twój kod logowania — ${code}`,
    html: buildHtml(code, expiryMinutes),
  })

  if (out.error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[OTP] Resend failed:', out.error.message)
      console.log(`[OTP dev] ${to} → ${code}`)
      return
    }
    throw new Error(out.error.message)
  }
}
