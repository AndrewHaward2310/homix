import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toLead } from '@/lib/mappers'
import { isResponse, requireRole } from '@/lib/auth/session'

// GET /api/leads — chỉ agent, và chỉ lead được giao cho chính mình.
export async function GET() {
  const auth = await requireRole('agent')
  if (isResponse(auth)) return auth
  const agent = auth

  const rows = await prisma.lead.findMany({
    where: { assignedAgentId: agent.id },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ leads: rows.map(toLead) })
}
