import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { toLead } from '@/lib/mappers'
import { isResponse, requireRole } from '@/lib/auth/session'

const bodySchema = z.object({ stage: z.enum(['new', 'consulting', 'closed']) })

// PATCH /api/leads/[id] — chỉ agent, và chỉ lead được giao cho chính mình.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('agent')
  if (isResponse(auth)) return auth
  const { id } = await params

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Stage không hợp lệ.' }, { status: 400 })

  const lead = await prisma.lead.findUnique({ where: { id } })
  if (!lead) return NextResponse.json({ error: 'Không tìm thấy lead.' }, { status: 404 })
  if (lead.assignedAgentId !== auth.id) {
    return NextResponse.json({ error: 'Không có quyền.' }, { status: 403 })
  }

  const updated = await prisma.lead.update({ where: { id }, data: { stage: parsed.data.stage } })
  return NextResponse.json({ lead: toLead(updated) })
}
