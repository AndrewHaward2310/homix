import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { toProperty } from '@/lib/mappers'

const querySchema = z.object({
  type: z.enum(['sale', 'rent_long', 'stay_short']).optional(),
  towerId: z.string().optional(),
  status: z.enum(['available', 'reserved', 'unavailable']).optional(),
  hostId: z.string().optional(),
  q: z.string().trim().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  beds: z.coerce.number().optional(), // số phòng ngủ tối thiểu
  amenities: z.string().optional(), // csv
  sort: z.enum(['relevant', 'price_asc', 'price_desc', 'newest']).default('relevant'),
  exclude: z.string().optional(), // id loại trừ (dùng cho "căn tương tự")
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(48).default(12),
})

const SORT: Record<string, Prisma.PropertyOrderByWithRelationInput> = {
  relevant: { createdAt: 'asc' },
  newest: { createdAt: 'desc' },
  price_asc: { priceVnd: 'asc' },
  price_desc: { priceVnd: 'desc' },
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Tham số lọc không hợp lệ.' }, { status: 400 })
  }
  const f = parsed.data

  const where: Prisma.PropertyWhereInput = {}
  if (f.type) where.type = f.type
  if (f.towerId) where.towerId = f.towerId
  if (f.status) where.status = f.status
  if (f.hostId) where.hostId = f.hostId
  if (f.beds) where.bedrooms = { gte: f.beds }
  if (f.exclude) where.id = { not: f.exclude }
  if (f.minPrice != null || f.maxPrice != null) {
    where.priceVnd = {
      ...(f.minPrice != null ? { gte: BigInt(Math.round(f.minPrice)) } : {}),
      ...(f.maxPrice != null ? { lte: BigInt(Math.round(f.maxPrice)) } : {}),
    }
  }
  const amenityList = f.amenities?.split(',').map((s) => s.trim()).filter(Boolean)
  if (amenityList?.length) where.amenities = { hasEvery: amenityList }
  if (f.q) {
    where.OR = [
      { code: { contains: f.q, mode: 'insensitive' } },
      { title: { path: ['vi'], string_contains: f.q } },
      { title: { path: ['en'], string_contains: f.q } },
    ]
  }

  const [total, rows] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy: SORT[f.sort],
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
    }),
  ])

  return NextResponse.json({
    properties: rows.map(toProperty),
    total,
    page: f.page,
    pageSize: f.pageSize,
  })
}
