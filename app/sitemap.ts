import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'
import { COMBO_DEFS } from '@/data/combos'
import { SITE_URL } from '@/lib/seo'

// Trang chủ prerender lúc build; sitemap cũng vậy. Nếu DB chưa với tới lúc build,
// vẫn trả các route tĩnh (revalidate để tự cập nhật danh sách căn sau).
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/search`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/combo`, changeFrequency: 'weekly', priority: 0.7 },
  ]

  let properties: MetadataRoute.Sitemap = []
  try {
    // Chỉ tin CÔNG KHAI, đã kiểm duyệt, còn hiệu lực — không đẩy tin nháp/ẩn cho crawler.
    const rows = await prisma.property.findMany({
      where: { verified: true, status: 'available' },
      select: { id: true, updatedAt: true },
    })
    properties = rows.map((p) => ({
      url: `${SITE_URL}/property/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  } catch {
    /* DB không sẵn lúc build → bỏ qua, lần regenerate sau sẽ có */
  }

  const combos: MetadataRoute.Sitemap = COMBO_DEFS.map((c) => ({
    url: `${SITE_URL}/combo/${c.id}`,
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  return [...staticRoutes, ...properties, ...combos]
}
