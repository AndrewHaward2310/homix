import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { toProperty } from '@/lib/mappers'
import { isResponse, requireUser } from '@/lib/auth/session'

// GET /api/favorites — danh sách căn đã lưu của user hiện tại + mảng id (cho UI ♥).
export async function GET() {
  const auth = await requireUser()
  if (isResponse(auth)) return auth
  const rows = await prisma.favorite.findMany({
    where: { userId: auth.id },
    include: { property: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({
    favorites: rows.map((r) => toProperty(r.property)),
    ids: rows.map((r) => r.propertyId),
  })
}

const bodySchema = z.object({ propertyId: z.string().min(1) })

// POST /api/favorites — thêm vào yêu thích (idempotent nhờ unique).
export async function POST(req: Request) {
  const auth = await requireUser()
  if (isResponse(auth)) return auth
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Thiếu propertyId.' }, { status: 400 })

  await prisma.favorite.upsert({
    where: { userId_propertyId: { userId: auth.id, propertyId: parsed.data.propertyId } },
    create: { userId: auth.id, propertyId: parsed.data.propertyId },
    update: {},
  })
  return NextResponse.json({ ok: true })
}

// DELETE /api/favorites?propertyId=... — bỏ lưu.
export async function DELETE(req: Request) {
  const auth = await requireUser()
  if (isResponse(auth)) return auth
  const propertyId = new URL(req.url).searchParams.get('propertyId')
  if (!propertyId) return NextResponse.json({ error: 'Thiếu propertyId.' }, { status: 400 })

  await prisma.favorite.deleteMany({ where: { userId: auth.id, propertyId } })
  return NextResponse.json({ ok: true })
}
