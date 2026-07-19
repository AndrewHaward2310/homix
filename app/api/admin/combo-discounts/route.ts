import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireRole, isResponse } from '@/lib/auth/session'

// Quản trị bậc giảm giá combo tự thiết kế. CHỈ admin.
// GET  — trả TẤT CẢ bậc (kể cả đang tắt) để chỉnh.
// PUT  — thay toàn bộ danh sách bậc bằng danh sách gửi lên.

export async function GET() {
  const gate = await requireRole('admin')
  if (isResponse(gate)) return gate

  const rows = await prisma.comboDiscountTier.findMany({ orderBy: { minPerks: 'asc' } })
  return NextResponse.json({
    tiers: rows.map((r) => ({
      minPerks: r.minPerks,
      percent: r.percent,
      maxDiscountVnd: r.maxDiscountVnd == null ? null : Number(r.maxDiscountVnd),
      active: r.active,
    })),
  })
}

/** Trần giảm giá tối đa cho phép — chặn số quá lớn mất chính xác khi ghi BigInt. */
const MAX_CAP_VND = 1_000_000_000_000

const tierSchema = z.object({
  minPerks: z.number().int().min(1).max(20),
  percent: z.number().min(0).max(100),
  maxDiscountVnd: z.number().int().min(0).max(MAX_CAP_VND).nullable().optional(),
  active: z.boolean().optional(),
})
// Luôn phải còn ít nhất 1 bậc — tránh lỡ tay xoá sạch cấu hình giảm giá.
const bodySchema = z.object({ tiers: z.array(tierSchema).min(1).max(10) })

export async function PUT(req: Request) {
  const gate = await requireRole('admin')
  if (isResponse(gate)) return gate

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu bậc giảm giá không hợp lệ.' }, { status: 400 })
  }
  const tiers = parsed.data.tiers

  // Không cho trùng mốc số trải nghiệm (minPerks là khoá duy nhất).
  const marks = tiers.map((t) => t.minPerks)
  if (new Set(marks).size !== marks.length) {
    return NextResponse.json({ error: 'Mỗi mốc số trải nghiệm chỉ được khai báo một lần.' }, { status: 400 })
  }

  // Thay toàn bộ trong một transaction (Serializable) để không rơi vào trạng thái
  // nửa vời và để 2 admin lưu cùng lúc không trộn kết quả.
  await prisma.$transaction(
    [
    prisma.comboDiscountTier.deleteMany({ where: { minPerks: { notIn: marks } } }),
    ...tiers.map((t) =>
      prisma.comboDiscountTier.upsert({
        where: { minPerks: t.minPerks },
        update: {
          percent: t.percent,
          maxDiscountVnd: t.maxDiscountVnd ?? null,
          active: t.active ?? true,
        },
        create: {
          minPerks: t.minPerks,
          percent: t.percent,
          maxDiscountVnd: t.maxDiscountVnd ?? null,
          active: t.active ?? true,
        },
      }),
    ),
    ],
    { isolationLevel: 'Serializable' },
  )

  const rows = await prisma.comboDiscountTier.findMany({ orderBy: { minPerks: 'asc' } })
  return NextResponse.json({
    tiers: rows.map((r) => ({
      minPerks: r.minPerks,
      percent: r.percent,
      maxDiscountVnd: r.maxDiscountVnd == null ? null : Number(r.maxDiscountVnd),
      active: r.active,
    })),
  })
}
