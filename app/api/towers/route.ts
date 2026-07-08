import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toTower } from '@/lib/mappers'

// Danh sách tòa tháp (shape Tower cơ bản) — dùng cho search-bar & tra cứu theo id.
export async function GET() {
  const rows = await prisma.tower.findMany({ orderBy: { id: 'asc' } })
  return NextResponse.json({ towers: rows.map(toTower) })
}
