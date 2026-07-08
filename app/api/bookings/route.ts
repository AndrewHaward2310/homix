import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { toBooking } from '@/lib/mappers'
import { isResponse, requireUser } from '@/lib/auth/session'

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
    checkIn: z.string().optional(), // YYYY-MM-DD
    checkOut: z.string().optional(),
    viewingAt: z.string().optional(), // ISO
  })
  .refine(
    (b) =>
      b.type === 'stay_short'
        ? Boolean(b.checkIn && b.checkOut)
        : Boolean(b.viewingAt),
    { message: 'Thiếu ngày lưu trú (stay_short) hoặc thời điểm hẹn xem (sale/rent_long).' },
  )

const MS_PER_DAY = 1000 * 60 * 60 * 24

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

  // stay_short: tổng = số đêm × giá/đêm. sale/rent_long: 0 (chỉ hẹn xem).
  let totalVnd = BigInt(0)
  if (body.type === 'stay_short') {
    const nights = Math.round(
      (new Date(body.checkOut!).getTime() - new Date(body.checkIn!).getTime()) / MS_PER_DAY,
    )
    if (!Number.isFinite(nights) || nights <= 0) {
      return NextResponse.json({ error: 'Khoảng ngày lưu trú không hợp lệ.' }, { status: 400 })
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
    totalVnd = property.priceVnd * BigInt(nights)
  }

  const row = await prisma.booking.create({
    data: {
      propertyId: body.propertyId,
      customerId: user.id,
      type: body.type,
      checkIn: body.checkIn ?? null,
      checkOut: body.checkOut ?? null,
      viewingAt: body.viewingAt ?? null,
      totalVnd,
    },
  })
  return NextResponse.json({ booking: toBooking(row) }, { status: 201 })
}
