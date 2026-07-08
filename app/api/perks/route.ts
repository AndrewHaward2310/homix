import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toPerk } from '@/lib/mappers'

export async function GET() {
  const rows = await prisma.perk.findMany({ orderBy: { id: 'asc' } })
  return NextResponse.json({ perks: rows.map(toPerk) })
}
