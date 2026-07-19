// Hydrate định nghĩa combo (data/combos.ts) thành TripCombo đầy đủ:
// nạp Property + Perk từ DB qua mappers và tính giá lẻ / giá gói / tiết kiệm.
import { prisma } from '@/lib/db'
import { toProperty, toPerk } from '@/lib/mappers'
import { COMBO_DEFS, type ComboDef } from '@/data/combos'
import type { TripCombo, TripComboPerk } from '@/types'

import { priceCombo } from '@/lib/combo-pricing'

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
      if (!perk) {
        // Data biên tập sai (perkId không tồn tại) — cảnh báo thay vì âm thầm bỏ qua.
        console.warn(`[combos] combo "${def.id}" tham chiếu perk không tồn tại: ${p.perkId}`)
        return null
      }
      return { perk, qty: p.qty }
    })
    .filter((x): x is TripComboPerk => x !== null)

  // Combo biên tập tự đặt mức giảm riêng (def.discount) — vẫn đi qua cùng một
  // hàm tính giá với combo tự thiết kế để hai luồng không lệch nhau.
  const priced = priceCombo({
    pricePerNightVnd: property.priceVnd,
    nights: def.nights,
    perks: perks.map((x) => ({ priceVnd: x.perk.priceVnd, qty: x.qty })),
    discount: def.discount,
  })

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
    listPriceVnd: priced.listPriceVnd,
    packagePriceVnd: priced.packagePriceVnd,
    savingsVnd: priced.savingsVnd,
    savingsPct: priced.savingsPct,
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
