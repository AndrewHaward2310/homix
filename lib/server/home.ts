import 'server-only'
import { prisma } from '@/lib/db'
import { toProperty } from '@/lib/mappers'
import type { Property } from '@/types'

/** Số liệu tổng quan hiển thị ở hero (đếm thật từ DB). */
export type HeroStats = { properties: number; towers: number; hosts: number }

/**
 * Căn nổi bật cho hero — lấy ở SERVER để ảnh nằm trong HTML đầu tiên
 * (preload được với `priority`, tránh LCP chậm & CLS do fetch sau hydration).
 */
export async function getHeroFeaturedServer(): Promise<Property | null> {
  const row = await prisma.property.findFirst({
    where: { status: 'available', images: { isEmpty: false } },
    orderBy: { ratingAvg: 'desc' },
  })
  return row ? toProperty(row) : null
}

/** Số liệu hero — đếm ở server, tránh khối số liệu nhảy sau khi fetch. */
export async function getHeroStatsServer(): Promise<HeroStats> {
  const [properties, towers, hosts] = await Promise.all([
    prisma.property.count(),
    prisma.tower.count(),
    prisma.user.count({ where: { role: 'host' } }),
  ])
  return { properties, towers, hosts }
}
