import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendOtpEmail } from '@/lib/send-otp-email'

export const runtime = 'nodejs'

const OTP_EXPIRY_MINUTES = 15

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (action === 'request') {
    return handleRequest(req)
  }
  if (action === 'verify') {
    return handleVerify(req)
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

async function handleRequest(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : null

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  await db.user.upsert({
    where: { email },
    create: { email },
    update: {},
  })

  await db.verificationToken.deleteMany({ where: { identifier: email } })

  const code = generateCode()
  const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await db.verificationToken.create({
    data: { identifier: email, token: code, expires },
  })

  await sendOtpEmail({ to: email, code, expiryMinutes: OTP_EXPIRY_MINUTES })

  return NextResponse.json({ ok: true })
}

async function handleVerify(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : null
  const code = typeof body?.code === 'string' ? body.code.trim() : null

  if (!email || !code) {
    return NextResponse.json({ error: 'Missing email or code' }, { status: 400 })
  }

  const token = await db.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token: code } },
  })

  if (!token) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  if (token.expires < new Date()) {
    await db.verificationToken.delete({
      where: { identifier_token: { identifier: email, token: code } },
    })
    return NextResponse.json({ error: 'Code expired' }, { status: 400 })
  }

  await db.verificationToken.delete({
    where: { identifier_token: { identifier: email, token: code } },
  })

  const user = await db.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  })

  await db.player.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  })

  return NextResponse.json({ ok: true })
}
