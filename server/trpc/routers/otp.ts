import { z } from 'zod'
import { db } from '@/lib/db'
import { isOtpEmailConfigured } from '@/lib/otp-mail'
import { sendOtpEmail } from '@/lib/send-otp-email'
import { publicProcedure, router, TRPCError } from '../init'

const OTP_EXPIRY_MINUTES = 15

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

const requestInput = z.object({
  email: z
    .string()
    .transform((v) => v.toLowerCase().trim())
    .pipe(z.string().min(1).email()),
})

const verifyInput = z.object({
  email: z
    .string()
    .transform((v) => v.toLowerCase().trim())
    .pipe(z.string().min(1).email()),
  code: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().regex(/^\d{6}$/)),
})

export const otpRouter = router({
  request: publicProcedure.input(requestInput).mutation(async ({ input }) => {
    const { email } = input

    if (process.env.NODE_ENV === 'production' && !isOtpEmailConfigured()) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'email_not_configured',
      })
    }

    await db.user.upsert({
      where: { email },
      create: { email },
      update: {},
    })

    await db.verificationToken.deleteMany({ where: { identifier: email } })

    const code = generateCode()
    const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    try {
      await sendOtpEmail({ to: email, code, expiryMinutes: OTP_EXPIRY_MINUTES })
    } catch (e) {
      console.error('[OTP] email send error:', e)
      throw new TRPCError({ code: 'BAD_GATEWAY', message: 'email_send_failed' })
    }

    await db.verificationToken.create({
      data: { identifier: email, token: code, expires },
    })

    return { ok: true as const }
  }),

  verify: publicProcedure.input(verifyInput).mutation(async ({ input }) => {
    const { email, code } = input

    const token = await db.verificationToken.findUnique({
      where: { identifier_token: { identifier: email, token: code } },
    })

    if (!token) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid code' })
    }

    if (token.expires < new Date()) {
      await db.verificationToken.delete({
        where: { identifier_token: { identifier: email, token: code } },
      })
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Code expired' })
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

    return { ok: true as const }
  }),
})
