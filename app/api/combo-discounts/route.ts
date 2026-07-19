import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { DiscountTier } from '@/lib/combo-pricing'

// Bậc giảm giá cho combo tự thiết kế (PUBLIC — builder cần để tính giá tại chỗ).
// Admin chỉnh ở /admin/settings qua route riêng có kiểm quyền.
export async function GET() {
  const rows = await prisma.comboDiscountTier.findMany({
    where: { active: true },
    orderBy: { minPerks: 'asc' },
  })
  const tiers: DiscountTier[] = rows.map((r) => ({
    minPerks: r.minPerks,
    percent: r.percent,
    maxDiscountVnd: r.maxDiscountVnd == null ? null : Number(r.maxDiscountVnd),
  }))
  return NextResponse.json({ tiers })
}
