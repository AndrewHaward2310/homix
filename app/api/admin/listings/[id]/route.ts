import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { toProperty } from '@/lib/mappers'
import { isResponse, requireRole } from '@/lib/auth/session'

const bodySchema = z.object({ verified: z.boolean() })

// PATCH — admin duyệt/gỡ duyệt tin (kiểm duyệt listing).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('admin')
  if (isResponse(auth)) return auth
  const { id } = await params
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 })

  const updated = await prisma.property.update({ where: { id }, data: { verified: parsed.data.verified } })
  return NextResponse.json({ property: toProperty(updated) })
}
