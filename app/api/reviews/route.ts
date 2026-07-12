import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toReview } from '@/lib/mappers'

// Đánh giá tiêu biểu toàn sàn (cho dải "Khách nói gì" trang chủ).
// Lấy review điểm cao (>=4), mới nhất, kèm tên/avatar khách + tiêu đề căn để dẫn link.
export async function GET(req: Request) {
  const raw = Number(new URL(req.url).searchParams.get('limit'))
  const limit = Math.min(Number.isFinite(raw) && raw > 0 ? raw : 9, 24)
  const rows = await prisma.review.findMany({
    where: { rating: { gte: 4 } },
    include: { customer: true, property: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  const reviews = rows.map((r) => ({
    ...toReview(r),
    propertyTitle: r.property.title,
  }))
  return NextResponse.json({ reviews })
}
