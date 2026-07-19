/**
 * Gợi ý trải nghiệm "hay đi cùng nhau" cho trình thiết kế combo.
 * Học từ các combo BIÊN TẬP (COMBO_DEFS): perk nào thường xuất hiện chung một combo
 * thì gợi ý thêm khi khách đã chọn perk liên quan. Thuần hàm, không phụ thuộc UI/DB.
 */
import { COMBO_DEFS } from '@/data/combos'

/** Bảng đồng-xuất-hiện: cooccur[a][b] = số combo mẫu chứa cả a lẫn b. */
function buildCooccurrence(): Map<string, Map<string, number>> {
  const co = new Map<string, Map<string, number>>()
  for (const def of COMBO_DEFS) {
    const ids = [...new Set(def.perks.map((p) => p.perkId))]
    for (const a of ids) {
      const row = co.get(a) ?? new Map<string, number>()
      for (const b of ids) {
        if (a === b) continue
        row.set(b, (row.get(b) ?? 0) + 1)
      }
      co.set(a, row)
    }
  }
  return co
}

const COOCCURRENCE = buildCooccurrence()

/**
 * Trả về id các perk nên gợi ý thêm, xếp theo độ liên quan giảm dần.
 * @param selectedIds perk khách đã chọn
 * @param availableIds perk đang có (để bỏ id không còn tồn tại)
 * @param limit số gợi ý tối đa
 */
export function suggestPerks(
  selectedIds: string[],
  availableIds: string[],
  limit = 3,
): string[] {
  if (selectedIds.length === 0) return []
  const chosen = new Set(selectedIds)
  const available = new Set(availableIds)
  const score = new Map<string, number>()

  for (const sel of selectedIds) {
    const row = COOCCURRENCE.get(sel)
    if (!row) continue
    for (const [other, count] of row) {
      if (chosen.has(other) || !available.has(other)) continue
      score.set(other, (score.get(other) ?? 0) + count)
    }
  }

  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)
}
