import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Số liệu tổng quan sàn (cho trust strip trang chủ) — đếm thật từ DB.
export async function GET() {
  const [properties, verified, towers, hosts, reviews] = await Promise.all([
    prisma.property.count(),
    prisma.property.count({ where: { verified: true } }),
    prisma.tower.count(),
    prisma.user.count({ where: { role: 'host' } }),
    prisma.review.count(),
  ])
  return NextResponse.json({ stats: { properties, verified, towers, hosts, reviews } })
}
