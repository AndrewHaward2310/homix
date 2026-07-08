'use client'

import { ComingSoon } from '@/components/portal/coming-soon'
import { useT } from '@/lib/i18n/provider'

export default function Page() {
  const t = useT()
  return <ComingSoon title={t('admin.perks')} />
}
