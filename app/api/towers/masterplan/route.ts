import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { MasterplanTower } from '@/services/propertyService'
import { MAP_DEFAULT_VIEW } from '@/services/propertyService'

// Tòa tháp cho <MasterplanLocator /> — kèm toạ độ bản đồ & metadata popup.
// Nguồn dữ liệu: bảng Tower (các cột mapLng/mapLat/bedroomsMin/Max/amenities).
export async function GET() {
  const rows = await prisma.tower.findMany({ orderBy: { id: 'asc' } })

  const towers: MasterplanTower[] = rows.map((t) => ({
    id: t.id,
    name: t.name,
    lngLat:
      t.mapLng != null && t.mapLat != null ? [t.mapLng, t.mapLat] : MAP_DEFAULT_VIEW.center,
    status: t.status,
    priceFromVnd: Number(t.priceFromVnd),
    image: t.image,
    bedroomsRange: { min: t.bedroomsMin ?? 1, max: t.bedroomsMax ?? 3 },
    amenities: t.amenities,
  }))

  return NextResponse.json({ towers })
}
