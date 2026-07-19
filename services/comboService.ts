// Combo "chuyến đi" — client → API. Trả về khớp type TripCombo.
import type { TripCombo } from '@/types'
import type { DiscountTier } from '@/lib/combo-pricing'

/** Bậc giảm giá cho combo tự thiết kế (admin cấu hình, đọc công khai). */
export async function getDiscountTiers(): Promise<DiscountTier[]> {
  const res = await fetch('/api/combo-discounts')
  if (!res.ok) throw new Error(`GET /api/combo-discounts thất bại (${res.status})`)
  return ((await res.json()) as { tiers: DiscountTier[] }).tiers
}

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

export const comboService = { getCombos, getCombo, getDiscountTiers }
