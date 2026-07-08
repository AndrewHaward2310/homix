// Ocean Park — Perk service (client → API). Trả về khớp type Perk.
import type { Perk } from '@/types'

export async function getPerks(): Promise<Perk[]> {
  const res = await fetch('/api/perks')
  if (!res.ok) throw new Error(`GET /api/perks thất bại (${res.status})`)
  const data = (await res.json()) as { perks: Perk[] }
  return data.perks
}

export const perkService = { getPerks }
