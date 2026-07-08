import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toProperty } from '@/lib/mappers'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const row = await prisma.property.findUnique({ where: { id } })
  if (!row) return NextResponse.json({ error: 'Không tìm thấy bất động sản.' }, { status: 404 })
  return NextResponse.json({ property: toProperty(row) })
}
