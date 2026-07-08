import 'server-only'
import { prisma } from '@/lib/db'
import { toProperty } from '@/lib/mappers'
import type { Property } from '@/types'

/** Đọc property trực tiếp từ DB (dùng cho generateMetadata ở server component). */
export async function getPropertyServer(id: string): Promise<Property | null> {
  const row = await prisma.property.findUnique({ where: { id } })
  return row ? toProperty(row) : null
}
