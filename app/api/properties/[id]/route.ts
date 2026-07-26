import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toProperty } from '@/lib/mappers'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const row = await prisma.property.findUnique({ where: { id } })
  if (!row) return NextResponse.json({ error: 'Không tìm thấy bất động sản.' }, { status: 404 })

  // Lượt đặt THẬT trong 30 ngày gần đây — chỉ đơn đã duyệt/hoàn tất (bỏ pending
  // để khách không thể thổi badge bằng yêu cầu chưa duyệt). Tín hiệu "đang hot".
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentBookings = await prisma.booking.count({
    where: { propertyId: id, createdAt: { gte: since }, status: { in: ['approved', 'completed'] } },
  })

  return NextResponse.json({ property: { ...toProperty(row), recentBookings } })
}
