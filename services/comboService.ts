// Combo "chuyến đi" — client → API. Trả về khớp type TripCombo.
import type { TripCombo } from '@/types'

export async function getCombos(): Promise<TripCombo[]> {
  const res = await fetch('/api/combos')
  if (!res.ok) throw new Error(`GET /api/combos thất bại (${res.status})`)
  return ((await res.json()) as { combos: TripCombo[] }).combos
}

export async function getCombo(id: string): Promise<TripCombo> {
  const res = await fetch(`/api/combos/${id}`)
  if (!res.ok) throw new Error(`GET /api/combos/${id} thất bại (${res.status})`)
  return ((await res.json()) as { combo: TripCombo }).combo
}

export const comboService = { getCombos, getCombo }
