/**
 * Logic giá combo dùng CHUNG cho combo biên tập (curated) và combo khách TỰ THIẾT KẾ.
 * Tách riêng để hai luồng không bao giờ lệch cách tính.
 */

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

/** Làm tròn xuống bội số 1.000đ cho giá đẹp. */
const roundVnd = (n: number) => Math.round(n / 1000) * 1000

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

  const packagePriceVnd = roundVnd(listPriceVnd - discountVnd)
  const savingsVnd = listPriceVnd - packagePriceVnd

  return {
    listPriceVnd,
    packagePriceVnd,
    savingsVnd,
    savingsPct: listPriceVnd > 0 ? Math.round((savingsVnd / listPriceVnd) * 100) : 0,
    appliedTier,
  }
}
