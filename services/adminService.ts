// HOMIX — Admin service (client → API). Chỉ admin gọi được (server chặn 403).
import type { AgentFunction, Property, User } from '@/types'

export type AdminOverview = {
  totalUsers: number
  usersByRole: Record<string, number>
  propsActive: number
  propsUnverified: number
  bookings: number
  gmv: number
}

export async function getOverview(): Promise<AdminOverview> {
  const res = await fetch('/api/admin/overview')
  if (!res.ok) throw new Error('overview failed')
  return res.json()
}

export async function getUsers(role?: string): Promise<User[]> {
  const res = await fetch(`/api/admin/users${role ? `?role=${role}` : ''}`)
  if (!res.ok) throw new Error('users failed')
  return (await res.json()).users
}

export async function setUserFunction(id: string, agentFunction: AgentFunction): Promise<boolean> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentFunction }),
  })
  return res.ok
}

export async function setListingVerified(id: string, verified: boolean): Promise<boolean> {
  const res = await fetch(`/api/admin/listings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verified }),
  })
  return res.ok
}

export const adminService = { getOverview, getUsers, setUserFunction, setListingVerified }
