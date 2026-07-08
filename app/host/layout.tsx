'use client'

import { LayoutDashboard, Building2, CalendarDays } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { PortalShell } from '@/components/portal/portal-shell'
import { useT } from '@/lib/i18n/provider'

export default function HostLayout({ children }: { children: React.ReactNode }) {
  const t = useT()
  const nav = [
    { href: '/host', label: t('host.overview'), icon: LayoutDashboard },
    { href: '/host/properties', label: t('host.properties'), icon: Building2 },
    { href: '/host/calendar', label: t('host.calendar'), icon: CalendarDays },
  ]
  return (
    <ProtectedRoute allow={['host']}>
      <PortalShell nav={nav} roleLabel={t('role.host')}>
        {children}
      </PortalShell>
    </ProtectedRoute>
  )
}
