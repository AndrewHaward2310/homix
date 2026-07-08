import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isResponse, requireRole } from '@/lib/auth/session'

// KPI toàn nền tảng (admin only).
export async function GET() {
  const auth = await requireRole('admin')
  if (isResponse(auth)) return auth

  const [usersByRole, propsActive, propsUnverified, bookings, revenueAgg] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.property.count({ where: { status: 'available' } }),
    prisma.property.count({ where: { verified: false } }),
    prisma.booking.count(),
    prisma.booking.aggregate({ _sum: { totalVnd: true }, where: { status: { in: ['approved', 'completed'] } } }),
  ])

  const roles: Record<string, number> = {}
  for (const r of usersByRole) roles[r.role] = r._count._all
  const totalUsers = Object.values(roles).reduce((a, b) => a + b, 0)

  return NextResponse.json({
    totalUsers,
    usersByRole: roles,
    propsActive,
    propsUnverified,
    bookings,
    gmv: Number(revenueAgg._sum.totalVnd ?? 0),
  })
}
