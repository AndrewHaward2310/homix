'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { PortalShell } from '@/components/portal/portal-shell'
import { useAuth } from '@/components/auth/auth-context'
import { useT } from '@/lib/i18n/provider'
import { AGENT_TABS, accessibleTabs, canAccessTab, firstTabHref } from '@/lib/access'

function AgentGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const t = useT()
  const pathname = usePathname()
  const router = useRouter()
  const fn = user?.agentFunction

  // Chặn route tab không có quyền → redirect tab hợp lệ đầu tiên.
  useEffect(() => {
    if (!user) return
    const tab = AGENT_TABS.find((x) => pathname === x.href || pathname.startsWith(x.href + '/'))
    if (tab && !canAccessTab(tab.group, fn)) {
      router.replace(firstTabHref(fn))
    }
  }, [user, fn, pathname, router])

  const nav = accessibleTabs(fn).map((tab) => ({
    href: tab.href,
    label: t(tab.labelKey),
    icon: tab.icon,
  }))
  const fnLabel = fn ? t(`agent.fn.${fn}`) : t('role.agent')

  return (
    <PortalShell nav={nav} roleLabel={fnLabel}>
      {children}
    </PortalShell>
  )
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allow={['agent']}>
      <AgentGuard>{children}</AgentGuard>
    </ProtectedRoute>
  )
}
