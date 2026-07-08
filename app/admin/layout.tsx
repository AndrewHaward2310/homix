'use client'

import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ClipboardList,
  Receipt,
  Gift,
  UserCog,
  BarChart3,
  Settings,
  ScrollText,
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { PortalShell } from '@/components/portal/portal-shell'
import { useT } from '@/lib/i18n/provider'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useT()
  const nav = [
    { href: '/admin', label: t('admin.overview'), icon: LayoutDashboard },
    { href: '/admin/users', label: t('admin.users'), icon: Users },
    { href: '/admin/hosts', label: t('admin.hosts'), icon: ShieldCheck },
    { href: '/admin/listings', label: t('admin.listings'), icon: ClipboardList },
    { href: '/admin/transactions', label: t('admin.transactions'), icon: Receipt },
    { href: '/admin/perks', label: t('admin.perks'), icon: Gift },
    { href: '/admin/leads', label: t('admin.leads'), icon: UserCog },
    { href: '/admin/reports', label: t('admin.reports'), icon: BarChart3 },
    { href: '/admin/settings', label: t('admin.settings'), icon: Settings },
    { href: '/admin/audit', label: t('admin.audit'), icon: ScrollText },
  ]
  return (
    <ProtectedRoute allow={['admin']}>
      <PortalShell nav={nav} roleLabel={t('role.admin')}>
        {children}
      </PortalShell>
    </ProtectedRoute>
  )
}
