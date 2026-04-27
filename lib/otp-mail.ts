export function isOtpEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() || process.env.RESEND_API_KEY?.trim()
  )
}

export function isOtpDevLogOnly(): boolean {
  return !isOtpEmailConfigured() && process.env.NODE_ENV !== 'production'
}
