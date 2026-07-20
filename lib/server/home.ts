import 'server-only'
import { prisma } from '@/lib/db'
import { toProperty } from '@/lib/mappers'
import type { Property } from '@/types'

/** Số liệu tổng quan hiển thị ở hero (đếm thật từ DB). */
export type HeroStats = { properties: number; towers: number; hosts: number }

/**
 * Trang chủ được PRERENDER lúc build (`○ /`), nên các hàm dưới đây chạy ngay trong
 * build container. Nếu DB không với tới được ở thời điểm đó (thiếu env, mạng, DB ngủ)
 * mà để lỗi ném ra thì **cả bản build sẽ fail** và site kẹt ở phiên bản cũ.
 * Vì vậy mọi truy vấn đều nuốt lỗi và trả giá trị an toàn — trang vẫn dựng được,
 * rồi tự làm mới nhờ `revalidate` ở app/page.tsx.
 */
function warn(scope: string, e: unknown) {
  console.error(`[home] ${scope} thất bại, dùng giá trị dự phòng:`, e)
}

/**
 * Căn nổi bật cho hero — lấy ở SERVER để ảnh nằm trong HTML đầu tiên
 * (preload được với `priority`, tránh LCP chậm & CLS do fetch sau hydration).
 */
export async function getHeroFeaturedServer(): Promise<Property | null> {
  try {
    const row = await prisma.property.findFirst({
      where: { status: 'available', images: { isEmpty: false } },
      orderBy: { ratingAvg: 'desc' },
    })
    return row ? toProperty(row) : null
  } catch (e) {
    warn('getHeroFeaturedServer', e)
    return null
  }
}

/** Số liệu hero — đếm ở server, tránh khối số liệu nhảy sau khi fetch. */
export async function getHeroStatsServer(): Promise<HeroStats> {
  try {
    const [properties, towers, hosts] = await Promise.all([
      prisma.property.count(),
      prisma.tower.count(),
      prisma.user.count({ where: { role: 'host' } }),
    ])
    return { properties, towers, hosts }
  } catch (e) {
    warn('getHeroStatsServer', e)
    return { properties: 0, towers: 0, hosts: 0 }
  }
}
