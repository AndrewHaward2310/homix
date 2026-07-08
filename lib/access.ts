import type { LucideIcon } from 'lucide-react'
import {
  Users,
  Sparkles,
  FolderKanban,
  FileSignature,
  Wallet,
  LineChart,
  ListChecks,
  Ticket,
  CalendarClock,
  ClipboardCheck,
  Gauge,
  MessageSquare,
  Settings,
} from 'lucide-react'
import type { AgentFunction } from '@/types'

export type TabGroup = 'sales' | 'care' | 'common'

export type AgentTab = {
  id: string
  href: string
  labelKey: string
  icon: LucideIcon
  group: TabGroup
}

/** Toàn bộ tab của Operations portal, gắn nhóm quyền. */
export const AGENT_TABS: AgentTab[] = [
  { id: 'leads', href: '/agent/leads', labelKey: 'agent.tab.leads', icon: Users, group: 'sales' },
  { id: 'match', href: '/agent/match', labelKey: 'agent.tab.match', icon: Sparkles, group: 'sales' },
  { id: 'collections', href: '/agent/collections', labelKey: 'agent.tab.collections', icon: FolderKanban, group: 'sales' },
  { id: 'contracts', href: '/agent/contracts', labelKey: 'agent.tab.contracts', icon: FileSignature, group: 'sales' },
  { id: 'commission', href: '/agent/commission', labelKey: 'agent.tab.commission', icon: Wallet, group: 'sales' },
  { id: 'pricing', href: '/agent/pricing', labelKey: 'agent.tab.pricing', icon: LineChart, group: 'sales' },
  { id: 'ops', href: '/agent/ops', labelKey: 'agent.tab.ops', icon: ListChecks, group: 'care' },
  { id: 'tickets', href: '/agent/tickets', labelKey: 'agent.tab.tickets', icon: Ticket, group: 'care' },
  { id: 'schedule', href: '/agent/schedule', labelKey: 'agent.tab.schedule', icon: CalendarClock, group: 'care' },
  { id: 'aftersale', href: '/agent/aftersale', labelKey: 'agent.tab.aftersale', icon: ClipboardCheck, group: 'care' },
  { id: 'quality', href: '/agent/quality', labelKey: 'agent.tab.quality', icon: Gauge, group: 'care' },
  { id: 'messages', href: '/agent/messages', labelKey: 'agent.tab.messages', icon: MessageSquare, group: 'common' },
  { id: 'settings', href: '/agent/settings', labelKey: 'agent.tab.settings', icon: Settings, group: 'common' },
]

/** Tab common ai cũng thấy; sales/care theo agentFunction ('both' thấy tất cả). */
export function canAccessTab(group: TabGroup, fn: AgentFunction | undefined): boolean {
  if (group === 'common') return true
  if (fn === 'both') return true
  return group === fn
}

export function accessibleTabs(fn: AgentFunction | undefined): AgentTab[] {
  return AGENT_TABS.filter((t) => canAccessTab(t.group, fn))
}

/** Tab hợp lệ đầu tiên để redirect. */
export function firstTabHref(fn: AgentFunction | undefined): string {
  return accessibleTabs(fn)[0]?.href ?? '/agent/messages'
}
