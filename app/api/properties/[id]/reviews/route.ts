import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toReview } from '@/lib/mappers'

// Đánh giá của một bất động sản (kèm tên/avatar khách).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await prisma.review.findMany({
    where: { propertyId: id },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ reviews: rows.map(toReview) })
}
