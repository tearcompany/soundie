export function classifySmtpFailure(
  cause: unknown,
): 'email_smtp_unreachable' | 'email_send_failed' {
  const chain: unknown[] = []
  let cur: unknown = cause
  for (let i = 0; i < 5 && cur; i++) {
    chain.push(cur)
    if (cur instanceof Error && cur.cause) {
      cur = cur.cause
    } else {
      break
    }
  }
  for (const item of chain) {
    if (item && typeof item === 'object' && 'code' in item) {
      const code = String((item as { code?: string }).code ?? '')
      if (
        code === 'ETIMEDOUT' ||
        code === 'ESOCKETTIMEDOUT' ||
        code === 'ECONNREFUSED' ||
        code === 'ENOTFOUND' ||
        code === 'EAI_AGAIN'
      ) {
        return 'email_smtp_unreachable'
      }
    }
    if (item instanceof Error) {
      const m = item.message
      if (/timeout/i.test(m) || /ECONNRESET/i.test(m) || /getaddrinfo/i.test(m)) {
        return 'email_smtp_unreachable'
      }
    }
  }
  return 'email_send_failed'
}
