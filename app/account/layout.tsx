'use client'

import { Luggage, Heart, User } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { PortalShell } from '@/components/portal/portal-shell'
import { useT } from '@/lib/i18n/provider'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const t = useT()
  const nav = [
    { href: '/account/trips', label: t('account.trips'), icon: Luggage },
    { href: '/account/favorites', label: t('account.favorites'), icon: Heart },
    { href: '/account/profile', label: t('account.profile'), icon: User },
  ]
  return (
    <ProtectedRoute allow={['customer']}>
      <PortalShell nav={nav} roleLabel={t('role.customer')}>
        {children}
      </PortalShell>
    </ProtectedRoute>
  )
}
