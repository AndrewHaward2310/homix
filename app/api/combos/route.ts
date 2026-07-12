import { NextResponse } from 'next/server'
import { getTripCombos } from '@/lib/combos'

// Danh sách combo "chuyến đi" (public). Hydrate Property + Perk, tính giá gói.
export async function GET() {
  const combos = await getTripCombos()
  return NextResponse.json({ combos })
}
