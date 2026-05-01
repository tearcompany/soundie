'use client'

import { BackgroundPresenceBridge } from '@/components/background-presence-bridge'
import { BackgroundPresenceIndicator } from '@/components/background-presence-indicator'

/** Must render inside `NextIntlClientProvider` (uses next-intl + i18n router). */
export function BackgroundPresenceRoot() {
  return (
    <>
      <BackgroundPresenceBridge />
      <BackgroundPresenceIndicator />
    </>
  )
}
