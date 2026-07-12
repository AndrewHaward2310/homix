import { NextResponse } from 'next/server'
import { getTripCombo } from '@/lib/combos'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const combo = await getTripCombo(id)
  if (!combo) return NextResponse.json({ error: 'Không tìm thấy combo.' }, { status: 404 })
  return NextResponse.json({ combo })
}
