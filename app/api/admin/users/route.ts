import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toUser } from '@/lib/mappers'
import { isResponse, requireRole } from '@/lib/auth/session'

// Danh sách toàn bộ user (admin only), lọc theo role qua ?role=.
export async function GET(req: Request) {
  const auth = await requireRole('admin')
  if (isResponse(auth)) return auth
  const role = new URL(req.url).searchParams.get('role')
  const rows = await prisma.user.findMany({
    where: role ? { role: role as never } : undefined,
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ users: rows.map(toUser) })
}
