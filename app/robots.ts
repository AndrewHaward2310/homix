import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Chặn CRAWL khu nội bộ/API/xác thực (các trang này còn được auth chặn ở middleware;
      // robots.txt chỉ ngăn thu thập, không phải cơ chế bảo mật hay noindex).
      disallow: ['/agent/', '/host/', '/admin/', '/account/', '/api/', '/login', '/403'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    // host: chỉ tên miền (không kèm scheme) cho crawler tôn trọng directive này.
    host: new URL(SITE_URL).host,
  }
}
