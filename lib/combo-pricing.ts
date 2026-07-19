/**
 * Logic giá combo dùng CHUNG cho combo biên tập (curated) và combo khách TỰ THIẾT KẾ.
 * Tách riêng để hai luồng không bao giờ lệch cách tính.
 */

/** Trần số lượng cho MỘT trải nghiệm trong một đơn. */
export const MAX_PERK_QTY = 20
/** Trần số LOẠI trải nghiệm khác nhau trong một đơn. */
export const MAX_PERK_KINDS = 20

/**
 * Gộp danh sách trải nghiệm theo id: cộng dồn số lượng, chặn trần, giữ thứ tự chọn.
 * Dùng CHUNG cho client (đọc URL) và server (đọc payload) — nếu chỉ một bên gộp,
 * một perk lặp nhiều lần sẽ bị đếm thành nhiều loại và tự leo bậc giảm giá.
 */
export function dedupePerks<T extends { perkId: string; qty: number }>(
  items: T[],
): { perkId: string; qty: number }[] {
  const byId = new Map<string, number>()
  for (const it of items) {
    if (!it.perkId || !Number.isInteger(it.qty) || it.qty <= 0) continue
    if (!byId.has(it.perkId) && byId.size >= MAX_PERK_KINDS) continue
    byId.set(it.perkId, Math.min((byId.get(it.perkId) ?? 0) + it.qty, MAX_PERK_QTY))
  }
  return [...byId].map(([perkId, qty]) => ({ perkId, qty }))
}

/** Bậc giảm giá — nguồn từ bảng ComboDiscountTier (admin chỉnh ở /admin/settings). */
export type DiscountTier = {
  minPerks: number
  /** 0–100 */
  percent: number
  /** Trần số tiền được giảm (VND); null = không giới hạn. */
  maxDiscountVnd: number | null
}

export type ComboPriceInput = {
  /** Giá lưu trú mỗi đêm (VND). */
  pricePerNightVnd: number
  nights: number
  /** Danh sách trải nghiệm đã chọn (đơn giá × số lượng). */
  perks: { priceVnd: number; qty: number }[]
  /**
   * Tỉ lệ giảm cố định 0–1 (combo biên tập tự đặt mức riêng).
   * Bỏ trống → tính theo `tiers` (combo tự thiết kế).
   */
  discount?: number
  tiers?: DiscountTier[]
}

export type ComboPrice = {
  listPriceVnd: number
  packagePriceVnd: number
  savingsVnd: number
  /** % tiết kiệm THỰC TẾ sau khi làm tròn/áp trần. */
  savingsPct: number
  /** Bậc đang áp dụng (null nếu không có giảm giá). */
  appliedTier: DiscountTier | null
}

/** Làm tròn XUỐNG bội số 1.000đ (dùng cho số tiền được giảm — giá đẹp, không vượt gốc). */
const floorVnd = (n: number) => Math.floor(n / 1000) * 1000

/** Bậc cao nhất mà số trải nghiệm đạt được (chỉ xét bậc đang bật). */
export function tierFor(perksCount: number, tiers: DiscountTier[]): DiscountTier | null {
  return (
    [...tiers]
      .filter((t) => perksCount >= t.minPerks)
      .sort((a, b) => b.minPerks - a.minPerks)[0] ?? null
  )
}

export function priceCombo(input: ComboPriceInput): ComboPrice {
  const { pricePerNightVnd, nights, perks, discount, tiers } = input

  const stayVnd = pricePerNightVnd * Math.max(1, nights)
  const perksVnd = perks.reduce((s, p) => s + p.priceVnd * p.qty, 0)
  const listPriceVnd = stayVnd + perksVnd

  // Số MÓN trải nghiệm khác nhau (không nhân theo số lượng) — bậc tính theo loại.
  const perksCount = perks.filter((p) => p.qty > 0).length
  const appliedTier = discount == null && tiers ? tierFor(perksCount, tiers) : null

  const rate = discount != null ? discount : (appliedTier?.percent ?? 0) / 100
  let discountVnd = listPriceVnd * Math.min(Math.max(rate, 0), 1)

  // Trần giảm giá (nếu bậc có đặt)
  const cap = appliedTier?.maxDiscountVnd
  if (cap != null) discountVnd = Math.min(discountVnd, cap)

  // Làm tròn ĐÚNG số tiền giảm (xuống bội 1.000đ) rồi trừ khỏi giá gốc: đảm bảo
  // packagePrice ≤ listPrice, savings ≥ 0, và không có "tiết kiệm ảo" khi giảm = 0.
  const savingsVnd = Math.max(0, Math.min(floorVnd(discountVnd), listPriceVnd))
  const packagePriceVnd = listPriceVnd - savingsVnd

  return {
    listPriceVnd,
    packagePriceVnd,
    savingsVnd,
    savingsPct: listPriceVnd > 0 ? Math.round((savingsVnd / listPriceVnd) * 100) : 0,
    appliedTier,
  }
}
