// Hydrate định nghĩa combo (data/combos.ts) thành TripCombo đầy đủ:
// nạp Property + Perk từ DB qua mappers và tính giá lẻ / giá gói / tiết kiệm.
import { prisma } from '@/lib/db'
import { toProperty, toPerk } from '@/lib/mappers'
import { COMBO_DEFS, type ComboDef } from '@/data/combos'
import type { TripCombo, TripComboPerk } from '@/types'

/** Làm tròn xuống bội số 1.000đ cho giá đẹp. */
const roundVnd = (n: number) => Math.round(n / 1000) * 1000

async function hydrate(def: ComboDef): Promise<TripCombo | null> {
  const [propRow, perkRows] = await Promise.all([
    prisma.property.findUnique({ where: { id: def.propertyId } }),
    prisma.perk.findMany({ where: { id: { in: def.perks.map((p) => p.perkId) } } }),
  ])
  if (!propRow) return null

  const property = toProperty(propRow)
  const byId = new Map(perkRows.map((r) => [r.id, toPerk(r)]))

  const perks: TripComboPerk[] = def.perks
    .map((p) => {
      const perk = byId.get(p.perkId)
      return perk ? { perk, qty: p.qty } : null
    })
    .filter((x): x is TripComboPerk => x !== null)

  const stayVnd = property.priceVnd * def.nights
  const perksVnd = perks.reduce((s, x) => s + x.perk.priceVnd * x.qty, 0)
  const listPriceVnd = stayVnd + perksVnd
  const packagePriceVnd = roundVnd(listPriceVnd * (1 - def.discount))
  const savingsVnd = listPriceVnd - packagePriceVnd

  return {
    id: def.id,
    title: def.title,
    subtitle: def.subtitle,
    themeImage: def.themeImage,
    nights: def.nights,
    guests: def.guests,
    tags: def.tags,
    property,
    perks,
    listPriceVnd,
    packagePriceVnd,
    savingsVnd,
    savingsPct: Math.round((savingsVnd / listPriceVnd) * 100),
    ratingAvg: property.ratingAvg ?? 4.9,
    reviewCount: property.reviewCount || 0,
  }
}

/** Tất cả combo đã hydrate, theo thứ tự biên tập. */
export async function getTripCombos(): Promise<TripCombo[]> {
  const defs = [...COMBO_DEFS].sort((a, b) => a.order - b.order)
  const combos = await Promise.all(defs.map(hydrate))
  return combos.filter((c): c is TripCombo => c !== null)
}

/** Một combo theo id (hoặc null). */
export async function getTripCombo(id: string): Promise<TripCombo | null> {
  const def = COMBO_DEFS.find((d) => d.id === id)
  return def ? hydrate(def) : null
}
