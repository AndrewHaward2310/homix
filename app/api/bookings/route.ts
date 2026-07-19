import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import type { BookingPerk, LocalizedText } from '@/types'
import { prisma } from '@/lib/db'
import { toBooking } from '@/lib/mappers'
import { isResponse, requireUser } from '@/lib/auth/session'
import { priceCombo, dedupePerks } from '@/lib/combo-pricing'

// GET /api/bookings — phạm vi theo vai trò:
//  - customer: đơn của chính mình
//  - host: đơn trên các BĐS mình sở hữu
//  - agent: tất cả
export async function GET() {
  const auth = await requireUser()
  if (isResponse(auth)) return auth
  const user = auth

  let where: Prisma.BookingWhereInput = {}
  if (user.role === 'customer') where = { customerId: user.id }
  else if (user.role === 'host') where = { property: { hostId: user.id } }

  const rows = await prisma.booking.findMany({ where, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ bookings: rows.map(toBooking) })
}

const createSchema = z
  .object({
    propertyId: z.string().min(1),
    type: z.enum(['sale', 'rent_long', 'stay_short']),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    viewingAt: z.string().optional(), // ISO
    // Trải nghiệm đặt kèm (từ trình tự thiết kế combo). CHỈ nhận id + số lượng —
    // giá luôn lấy từ DB, không bao giờ tin giá do client gửi.
    perks: z
      .array(z.object({ perkId: z.string().min(1), qty: z.number().int().min(1).max(20) }))
      .max(20)
      .optional(),
  })
  .refine(
    (b) =>
      b.type === 'stay_short'
        ? Boolean(b.checkIn && b.checkOut)
        : Boolean(b.viewingAt),
    { message: 'Thiếu ngày lưu trú (stay_short) hoặc thời điểm hẹn xem (sale/rent_long).' },
  )

const MS_PER_DAY = 1000 * 60 * 60 * 24
const MAX_NIGHTS = 30 // trần hợp lý cho lưu trú ngắn ngày; chặn số đêm phi lý

// POST /api/bookings — chỉ customer tạo. Tổng tiền LUÔN tính ở server, không tin client.
export async function POST(req: Request) {
  const auth = await requireUser()
  if (isResponse(auth)) return auth
  const user = auth
  if (user.role !== 'customer') {
    return NextResponse.json({ error: 'Chỉ khách hàng được đặt chỗ.' }, { status: 403 })
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dữ liệu đặt chỗ không hợp lệ.' },
      { status: 400 },
    )
  }
  const body = parsed.data

  const property = await prisma.property.findUnique({ where: { id: body.propertyId } })
  if (!property) {
    return NextResponse.json({ error: 'Không tìm thấy bất động sản.' }, { status: 404 })
  }
  if (property.type !== body.type) {
    return NextResponse.json(
      { error: 'Loại đặt chỗ không khớp với loại bất động sản.' },
      { status: 400 },
    )
  }
  // Trải nghiệm đặt kèm chỉ dành cho lưu trú ngắn ngày — không nhận nhầm ở mua/thuê.
  if (body.type !== 'stay_short' && body.perks?.length) {
    return NextResponse.json(
      { error: 'Chỉ đơn lưu trú ngắn ngày mới đặt kèm trải nghiệm.' },
      { status: 400 },
    )
  }

  // stay_short: tổng = (đêm × giá/đêm + trải nghiệm) − giảm giá bậc thang.
  // sale/rent_long: 0 (chỉ hẹn xem).
  let totalVnd = BigInt(0)
  let bookedPerks: BookingPerk[] = []
  if (body.type === 'stay_short') {
    const nights = Math.round(
      (new Date(body.checkOut!).getTime() - new Date(body.checkIn!).getTime()) / MS_PER_DAY,
    )
    if (!Number.isFinite(nights) || nights <= 0) {
      return NextResponse.json({ error: 'Khoảng ngày lưu trú không hợp lệ.' }, { status: 400 })
    }
    if (nights > MAX_NIGHTS) {
      return NextResponse.json(
        { error: `Lưu trú ngắn ngày tối đa ${MAX_NIGHTS} đêm.` },
        { status: 400 },
      )
    }
    // Chặn double-booking: có khoảng đã đặt chồng lấn -> 409.
    const clash = await prisma.booking.findFirst({
      where: {
        propertyId: body.propertyId,
        type: 'stay_short',
        status: { in: ['pending', 'approved'] },
        checkIn: { lt: body.checkOut! },
        checkOut: { gt: body.checkIn! },
      },
      select: { id: true },
    })
    if (clash) {
      return NextResponse.json(
        { error: 'Khoảng ngày này đã có người đặt. Vui lòng chọn ngày khác.' },
        { status: 409 },
      )
    }
    // Trải nghiệm đặt kèm: nạp giá THẬT từ DB (bỏ id lạ), rồi tính giá gói theo
    // bậc giảm giá do admin cấu hình — dùng chung priceCombo với trình thiết kế combo.
    // Gộp theo perkId TRƯỚC khi tính: gửi cùng một perk 10 lần sẽ bị priceCombo
    // đếm thành 10 loại và tự leo lên bậc giảm giá cao nhất.
    const wanted = dedupePerks(body.perks ?? [])
    const perkRows = wanted.length
      ? await prisma.perk.findMany({ where: { id: { in: wanted.map((p) => p.perkId) } } })
      : []
    const perkById = new Map(perkRows.map((r) => [r.id, r]))
    // Có id lạ (không tồn tại trong DB) -> báo lỗi rõ, KHÔNG âm thầm bỏ để giá
    // khách trả khác với giá vừa xem.
    const unknown = wanted.filter((w) => !perkById.has(w.perkId))
    if (unknown.length) {
      return NextResponse.json(
        { error: 'Có trải nghiệm không hợp lệ trong combo.' },
        { status: 400 },
      )
    }
    const chosen: BookingPerk[] = wanted.map((w) => {
      const row = perkById.get(w.perkId)!
      return { perkId: row.id, qty: w.qty, priceVnd: Number(row.priceVnd), name: row.name as LocalizedText }
    })

    const tierRows = await prisma.comboDiscountTier.findMany({
      where: { active: true },
      orderBy: { minPerks: 'asc' },
    })
    const priced = priceCombo({
      pricePerNightVnd: Number(property.priceVnd),
      nights,
      perks: chosen.map((c) => ({ priceVnd: c.priceVnd, qty: c.qty })),
      tiers: tierRows.map((t) => ({
        minPerks: t.minPerks,
        percent: t.percent,
        maxDiscountVnd: t.maxDiscountVnd == null ? null : Number(t.maxDiscountVnd),
      })),
    })
    totalVnd = BigInt(Math.round(priced.packagePriceVnd))
    bookedPerks = chosen
  }

  const row = await prisma.booking.create({
    data: {
      propertyId: body.propertyId,
      customerId: user.id,
      type: body.type,
      checkIn: body.checkIn ?? null,
      checkOut: body.checkOut ?? null,
      viewingAt: body.viewingAt ?? null,
      perks: bookedPerks.length ? (bookedPerks as unknown as Prisma.InputJsonValue) : undefined,
      totalVnd,
    },
  })
  return NextResponse.json({ booking: toBooking(row) }, { status: 201 })
}
