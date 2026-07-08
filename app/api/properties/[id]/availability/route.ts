import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { AvailabilityRange } from '@/types'

// Khoảng ngày ĐÃ BỊ ĐẶT (chặn trên lịch) — suy từ booking stay_short chưa bị từ chối.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await prisma.booking.findMany({
    where: {
      propertyId: id,
      type: 'stay_short',
      status: { in: ['pending', 'approved'] },
      checkIn: { not: null },
      checkOut: { not: null },
    },
    select: { checkIn: true, checkOut: true },
  })
  const ranges: AvailabilityRange[] = rows
    .filter((r) => r.checkIn && r.checkOut)
    .map((r) => ({ from: r.checkIn as string, to: r.checkOut as string }))
  return NextResponse.json({ blocked: ranges })
}
