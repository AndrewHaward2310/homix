import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { toBooking } from '@/lib/mappers'
import { isResponse, requireUser } from '@/lib/auth/session'

const bodySchema = z.object({ action: z.enum(['cancel', 'approve', 'decline']) })

// PATCH /api/bookings/[id] — khách huỷ đơn của mình; host duyệt/từ chối đơn trên
// BĐS của mình. Ownership check ở server (không tin client).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if (isResponse(auth)) return auth
  const user = auth
  const { id } = await params

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Hành động không hợp lệ.' }, { status: 400 })

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { property: { select: { hostId: true } } },
  })
  if (!booking) return NextResponse.json({ error: 'Không tìm thấy đơn.' }, { status: 404 })

  const { action } = parsed.data

  if (action === 'cancel') {
    if (booking.customerId !== user.id) {
      return NextResponse.json({ error: 'Không có quyền.' }, { status: 403 })
    }
    if (!['pending', 'approved'].includes(booking.status)) {
      return NextResponse.json({ error: 'Đơn không thể huỷ.' }, { status: 409 })
    }
    const updated = await prisma.booking.update({ where: { id }, data: { status: 'cancelled' } })
    return NextResponse.json({ booking: toBooking(updated) })
  }

  // approve / decline — chỉ host sở hữu BĐS.
  if (user.role !== 'host' || booking.property.hostId !== user.id) {
    return NextResponse.json({ error: 'Không có quyền.' }, { status: 403 })
  }
  if (booking.status !== 'pending') {
    return NextResponse.json({ error: 'Đơn đã được xử lý.' }, { status: 409 })
  }
  const updated = await prisma.booking.update({
    where: { id },
    data: { status: action === 'approve' ? 'approved' : 'declined' },
  })
  return NextResponse.json({ booking: toBooking(updated) })
}
