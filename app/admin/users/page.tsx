'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Search } from 'lucide-react'
import type { AgentFunction, Role, User } from '@/types'
import { adminService } from '@/services/adminService'
import { useT } from '@/lib/i18n/provider'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'

const ROLES: (Role | 'all')[] = ['all', 'customer', 'host', 'agent', 'admin']

export default function AdminUsersPage() {
  const t = useT()
  const [state, setState] = useState<ViewState>('loading')
  const [users, setUsers] = useState<User[]>([])
  const [role, setRole] = useState<Role | 'all'>('all')
  const [q, setQ] = useState('')

  const load = () => {
    setState('loading')
    adminService
      .getUsers()
      .then((u) => {
        setUsers(u)
        setState('success')
      })
      .catch(() => setState('error'))
  }
  useEffect(load, [])

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          (role === 'all' || u.role === role) &&
          (!q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())),
      ),
    [users, role, q],
  )

  const setFn = async (id: string, fn: AgentFunction) => {
    const prev = users
    setUsers((us) => us.map((u) => (u.id === id ? { ...u, agentFunction: fn } : u)))
    const ok = await adminService.setUserFunction(id, fn)
    if (!ok) setUsers(prev)
  }

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">{t('admin.users')}</h1>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-background px-4 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên / email…"
            className="w-full bg-transparent font-sans text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role | 'all')}
          className="rounded-full border border-border bg-background px-4 py-2 font-sans text-sm outline-none"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r === 'all' ? 'Tất cả' : t(`role.${r}`)}
            </option>
          ))}
        </select>
      </div>

      <StateWrapper state={state} className="mt-5" onRetry={load}>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[640px] text-left">
            <thead className="border-b border-border bg-secondary/40">
              <tr className="font-sans text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                <th className="px-4 py-3">{t('admin.name')}</th>
                <th className="px-4 py-3">{t('admin.email')}</th>
                <th className="px-4 py-3">{t('admin.role')}</th>
                <th className="px-4 py-3">{t('admin.function')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id} className="font-sans text-sm">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Image src={u.avatarUrl || '/placeholder-user.jpg'} alt={u.name} width={28} height={28} className="size-7 rounded-full object-cover" />
                      <span className="font-medium text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[0.75rem] font-medium text-foreground">
                      {t(`role.${u.role}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === 'agent' ? (
                      <select
                        value={u.agentFunction ?? 'both'}
                        onChange={(e) => setFn(u.id, e.target.value as AgentFunction)}
                        className="rounded-lg border border-border bg-background px-2.5 py-1.5 font-sans text-[0.8125rem] outline-none"
                      >
                        <option value="sales">{t('agent.fn.sales')}</option>
                        <option value="care">{t('agent.fn.care')}</option>
                        <option value="both">{t('agent.fn.both')}</option>
                      </select>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StateWrapper>
    </div>
  )
}
