// Ocean Park — Lead service (client → API). Chỉ agent gọi được (server chặn 403).
import type { Lead } from '@/types'

export async function getLeads(): Promise<Lead[]> {
  const res = await fetch('/api/leads')
  if (!res.ok) throw new Error(`GET /api/leads thất bại (${res.status})`)
  const data = (await res.json()) as { leads: Lead[] }
  return data.leads
}

import type { LeadStage } from '@/types'

/** Đổi stage của lead (Kanban). */
export async function updateLeadStage(id: string, stage: LeadStage): Promise<boolean> {
  const res = await fetch(`/api/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage }),
  })
  return res.ok
}

export const leadService = { getLeads, updateLeadStage }
